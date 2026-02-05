import React from 'react';
import {
  Body,
  Heading,
  Tailwind,
  Text,
  Container,
  Section,
} from '@react-email/components';
import { Html } from '@react-email/html';

interface TwoFactorTemplateProps {
  token: string;
}

export function TwoFactorTemplate({ token }: TwoFactorTemplateProps) {
  return (
    <Tailwind>
      <Html>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <Heading className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Two-Factor Authentication
            </Heading>

            <Text className="text-gray-600 text-center mb-6">
              We received a login attempt to your account.
              <br />
              To continue, please use the verification code below.
            </Text>

            <Section className="bg-gray-50 border border-gray-200 rounded-lg py-4 mb-6">
              <Text className="text-center text-3xl font-mono font-bold tracking-widest text-gray-900">
                {token}
              </Text>
            </Section>

            <Text className="text-gray-600 text-sm mb-4">
              This code is valid for a limited time. If you did not try to sign
              in, you can safely ignore this email.
            </Text>

            <Text className="text-gray-400 text-xs text-center mt-8">
              © {new Date().getFullYear()} Nest Auth. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
