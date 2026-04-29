import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateTransport, mockSendMail } = vi.hoisted(() => ({
  mockCreateTransport: vi.fn(),
  mockSendMail: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

import { POST } from "@/app/api/contact/route";

function createRequest(body: unknown) {
  return new NextRequest("http://localhost/api/contact", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("POST /api/contact", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      CONTACT_FROM_EMAIL: "no-reply@example.com",
      CONTACT_SMTP_HOST: "smtp.example.com",
      CONTACT_SMTP_PASS: "secret",
      CONTACT_SMTP_PORT: "465",
      CONTACT_SMTP_SECURE: "true",
      CONTACT_SMTP_USER: "smtp-user",
    };
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
    mockSendMail.mockResolvedValue({ messageId: "m1" });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("sends anonymous contact email to the configured recipient", async () => {
    const response = await POST(
      createRequest({
        message: "공유 링크 복사가 안 됩니다.",
        senderEmail: "user@example.com",
        senderName: "익명 사용자",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockCreateTransport).toHaveBeenCalledWith({
      auth: { pass: "secret", user: "smtp-user" },
      host: "smtp.example.com",
      port: 465,
      secure: true,
    });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: "user@example.com",
        subject: "[모두스팟] 익명 문의",
        to: "dmswl6310@gmail.com",
      })
    );
  });

  it("returns 503 when SMTP environment variables are missing", async () => {
    delete process.env.CONTACT_SMTP_HOST;

    const response = await POST(createRequest({ message: "문의 내용은 충분히 깁니다." }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "문의 메일 설정이 아직 완료되지 않았습니다.",
    });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("validates message length and optional reply email", async () => {
    const shortMessageResponse = await POST(createRequest({ message: "짧음" }));
    expect(shortMessageResponse.status).toBe(400);

    const invalidEmailResponse = await POST(
      createRequest({ message: "문의 내용은 충분히 깁니다.", senderEmail: "not-email" })
    );
    expect(invalidEmailResponse.status).toBe(400);
    await expect(invalidEmailResponse.json()).resolves.toEqual({
      error: "답장 이메일 형식을 확인해주세요.",
    });
  });
});
