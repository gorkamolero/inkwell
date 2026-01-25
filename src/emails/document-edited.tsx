import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
  Img,
} from "@react-email/components";

interface DocumentEditedEmailProps {
  editorName: string;
  editorAvatar?: string;
  documentTitle: string;
  projectName: string;
  changeSummary: string;
  editLink: string;
  when: string;
}

export function DocumentEditedEmail({
  editorName,
  editorAvatar,
  documentTitle,
  projectName,
  changeSummary,
  editLink,
  when,
}: DocumentEditedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{editorName} edited "{documentTitle}"</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Container style={{ maxWidth: "600px", padding: "40px 20px" }}>
          {/* Logo/Brand */}
          <Section style={{ marginBottom: "32px" }}>
            <Text style={{
              fontSize: "28px",
              fontWeight: "900",
              letterSpacing: "-1px",
              margin: 0,
              color: "#000",
            }}>
              Hotpress
            </Text>
          </Section>

          {/* Main Card */}
          <Section style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e5e5",
          }}>
            {/* Editor Info */}
            <Section style={{ marginBottom: "24px" }}>
              <Text style={{ color: "#666", marginBottom: "8px", fontSize: "14px" }}>
                {editorName} made changes
              </Text>
              <Heading style={{
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "16px",
                marginTop: 0,
                color: "#111",
              }}>
                {documentTitle}
              </Heading>
              <Text style={{ color: "#666", fontSize: "14px" }}>
                in <strong>{projectName}</strong>
              </Text>
            </Section>

            {/* Change Summary */}
            <Section style={{
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
              border: "1px solid #e5e5e5",
            }}>
              <Text style={{
                fontSize: "13px",
                color: "#666",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: "600",
              }}>
                What changed
              </Text>
              <Text style={{
                fontSize: "15px",
                color: "#333",
                marginTop: "8px",
                marginBottom: 0,
                lineHeight: "1.5",
              }}>
                {changeSummary}
              </Text>
            </Section>

            {/* CTA Button */}
            <Button
              href={editLink}
              style={{
                backgroundColor: "#000",
                color: "white",
                padding: "14px 28px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
                display: "inline-block",
                fontSize: "15px",
              }}
            >
              View changes
            </Button>

            {/* Timestamp */}
            <Text style={{
              fontSize: "12px",
              color: "#999",
              marginTop: "24px",
              marginBottom: 0,
            }}>
              {when}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ marginTop: "24px", textAlign: "center" }}>
            <Text style={{ fontSize: "12px", color: "#999", lineHeight: "1.6" }}>
              You're receiving this because you're collaborating on "{projectName}"<br />
              <a href="#" style={{ color: "#666", textDecoration: "underline" }}>
                Unsubscribe
              </a> from these notifications
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
