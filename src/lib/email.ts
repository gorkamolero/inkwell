import { Resend } from "resend";
import { DocumentEditedEmail } from "@/emails";

// Lazy initialization - only create Resend client when actually sending
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, email notifications will be skipped");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendDocumentEditedEmailParams {
  to: string;
  editorName: string;
  editorEmail: string;
  documentTitle: string;
  projectName: string;
  changeSummary: string;
  editLink: string;
}

export async function sendDocumentEditedEmail({
  to,
  editorName,
  editorEmail,
  documentTitle,
  projectName,
  changeSummary,
  editLink,
}: SendDocumentEditedEmailParams) {
  const resend = getResend();
  if (!resend) {
    console.log("Email notification skipped (no Resend API key):", to);
    return { success: true, skipped: true };
  }

  const emailHtml = DocumentEditedEmail({
    editorName,
    documentTitle,
    projectName,
    changeSummary,
    editLink,
    when: new Date().toLocaleString(),
  });

  return resend.emails.send({
    from: "Hotpress <notifications@hotpress.app>",
    to,
    subject: `${editorName} edited "${documentTitle}"`,
    react: emailHtml,
    replyTo: editorEmail,
  });
}
