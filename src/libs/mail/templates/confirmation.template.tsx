import React from 'react';
import {
  Body,
  Heading,
  Link,
  Tailwind,
  Text,
  Container,
} from '@react-email/components';
import { Html } from '@react-email/html';

interface ConfirmationTemplateProps {
  domain: string;
  token: string;
}

export function ConfirmationTemplate({
  domain,
  token,
}: ConfirmationTemplateProps) {
  const confirmLink = `${domain}/api/auth/new-verification?token=${token}`;

  return (
    <Tailwind>
      <Html>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white rounded-lg shadow-md px-8 py-10 max-w-md mx-auto">
            <Heading className="text-2xl font-bold text-gray-900 mb-4">
              Confirm your email address
            </Heading>

            <Text className="text-gray-700 mb-4">
              Thanks for signing up! To complete your registration, please
              confirm your email address by clicking the button below.
            </Text>

            <div className="text-center my-8">
              <Link
                href={confirmLink}
                className="inline-block bg-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-md no-underline"
              >
                Confirm email
              </Link>
            </div>

            <Text className="text-gray-700 mb-4">
              This confirmation link is valid for <strong>1 hour</strong>. If
              you didn’t create an account, you can safely ignore this email.
            </Text>

            <Text className="text-gray-500 text-sm">
              Best regards,
              <br />
              <span className="font-medium">The Nest Auth Team</span>
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
