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

interface ResetPasswordTemplateProps {
  domain: string;
  token: string;
}

export function ResetPasswordTemplate({
  domain,
  token,
}: ResetPasswordTemplateProps) {
  const resetLink = `${domain}/api/auth/new-password?token=${token}`;

  return (
    <Tailwind>
      <Html>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
            <Heading className="text-2xl font-bold text-gray-900 mb-4">
              Reset your password
            </Heading>

            <Text className="text-gray-700 mb-4">
              We received a request to reset the password for your account.
            </Text>

            <Text className="text-gray-700 mb-6">
              Click the button below to set a new password. If you didn’t
              request a password reset, you can safely ignore this email.
            </Text>

            <Link
              href={resetLink}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold text-center no-underline"
            >
              Reset password
            </Link>

            <Text className="text-gray-600 text-sm mt-6">
              This link will expire in <strong>1 hour</strong>.
            </Text>

            <Text className="text-gray-400 text-xs mt-8">
              © {new Date().getFullYear()} Nest Auth. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
