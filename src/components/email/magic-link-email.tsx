import {
  Html,
  Head,
  Font,
  Preview,
  Tailwind,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components"

interface MagicLinkEmailProps {
  magicUrl: string
}

export function MagicLinkEmail({ magicUrl }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Sign in to your account with this magic link</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Text className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                <strong>Sign in to your account</strong>
              </Text>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Hello,
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              You requested a magic link to sign in to your account. Click the button below to sign in:
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#10b981] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={magicUrl}
              >
                Sign in to your account
              </Button>
            </Section>

            <Text className="text-black text-[14px] leading-[24px]">
              Or copy and paste this URL into your browser:{" "}
              <a href={magicUrl} className="text-blue-600 no-underline">
                {magicUrl}
              </a>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Section className="bg-[#f6f9fc] rounded p-[20px]">
              <Text className="text-[#64748b] text-[12px] leading-[20px] m-0">
                <strong>Security notice:</strong> This magic link will expire in 15 minutes and can only be used once.
                If you didn't request this link, you can safely ignore this email.
              </Text>
            </Section>

            <Text className="text-[#8898aa] text-[12px] leading-[22px] mt-[12px] mb-0">
              This magic link was sent from your video repurposing application.
              If you have any questions, please contact support.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default MagicLinkEmail