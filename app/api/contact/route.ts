import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const CONTACT_RECIPIENT_EMAIL = "dmswl6310@gmail.com";
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_SENDER_FIELD_LENGTH = 120;

export const runtime = "nodejs";

let cachedTransporter: nodemailer.Transporter | null = null;

type ContactPayload = {
  message?: unknown;
  senderEmail?: unknown;
  senderName?: unknown;
};

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSmtpPort() {
  const rawPort = process.env.CONTACT_SMTP_PORT;
  if (!rawPort) return 587;

  const port = Number(rawPort);
  return Number.isInteger(port) && port > 0 ? port : 587;
}

function getRequiredMailConfig() {
  const host = process.env.CONTACT_SMTP_HOST;
  const user = process.env.CONTACT_SMTP_USER;
  const pass = process.env.CONTACT_SMTP_PASS;
  const from = process.env.CONTACT_FROM_EMAIL || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    from,
    host,
    pass,
    port: getSmtpPort(),
    secure: process.env.CONTACT_SMTP_SECURE === "true",
    user,
  };
}

function createMailText(params: {
  message: string;
  senderEmail: string;
  senderName: string;
}) {
  const senderName = params.senderName || "익명";
  const senderEmail = params.senderEmail || "미입력";

  return [
    "모두스팟 익명 문의가 도착했습니다.",
    "",
    `이름: ${senderName}`,
    `답장 이메일: ${senderEmail}`,
    "",
    "문의 내용:",
    params.message,
  ].join("\n");
}

function getTransporter(config: NonNullable<ReturnType<typeof getRequiredMailConfig>>) {
  cachedTransporter ??= nodemailer.createTransport({
    auth: {
      pass: config.pass,
      user: config.user,
    },
    host: config.host,
    port: config.port,
    secure: config.secure,
  });

  return cachedTransporter;
}

export async function POST(request: NextRequest) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "문의 내용을 다시 확인해주세요." }, { status: 400 });
  }

  const message = getOptionalString(payload.message);
  const senderEmail = getOptionalString(payload.senderEmail);
  const senderName = getOptionalString(payload.senderName);

  if (message.length < 10) {
    return NextResponse.json({ error: "문의 내용은 10자 이상 입력해주세요." }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `문의 내용은 ${MAX_MESSAGE_LENGTH}자 이내로 입력해주세요.` }, { status: 400 });
  }

  if (senderName.length > MAX_SENDER_FIELD_LENGTH || senderEmail.length > MAX_SENDER_FIELD_LENGTH) {
    return NextResponse.json({ error: "이름과 이메일은 120자 이내로 입력해주세요." }, { status: 400 });
  }

  if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    return NextResponse.json({ error: "답장 이메일 형식을 확인해주세요." }, { status: 400 });
  }

  const config = getRequiredMailConfig();
  if (!config) {
    return NextResponse.json(
      { error: "문의 메일 설정이 아직 완료되지 않았습니다." },
      { status: 503 }
    );
  }

  try {
    const transporter = getTransporter(config);
    await transporter.sendMail({
      from: config.from,
      replyTo: senderEmail || undefined,
      subject: "[모두스팟] 익명 문의",
      text: createMailText({ message, senderEmail, senderName }),
      to: CONTACT_RECIPIENT_EMAIL,
    });
  } catch (error) {
    console.error("[contact] Failed to send contact email", { error });
    return NextResponse.json(
      { error: "문의 메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
