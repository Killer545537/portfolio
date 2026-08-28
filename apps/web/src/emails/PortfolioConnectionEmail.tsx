import {
    Body,
    Container,
    Head,
    Html,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';
import { Fragment } from 'react';
import { EMAIL_COPY, PROFILE } from '@/lib/data';

interface PortfolioConnectionEmailProps {
    name: string;
}

// Copy lives in me.toml under [email], shared with apps/ssh/src/email.rs.
// Only the layout is per-language.
export function PortfolioConnectionEmail({
    name,
}: PortfolioConnectionEmailProps) {
    const greeting = EMAIL_COPY.greeting.replace('{name}', name);
    const footer = EMAIL_COPY.footer.replace('{site}', PROFILE.site);

    return (
        <Html lang='en' dir='ltr'>
            <Tailwind>
                <Head />
                <Body className='bg-gray-100 font-sans py-10'>
                    <Container className='bg-white rounded-xl p-8 max-w-150 mx-auto'>
                        <Section>
                            <Text className='text-[18px] font-bold text-gray-900 mb-6 mt-0'>
                                {greeting}
                            </Text>

                            {EMAIL_COPY.paragraphs.map((paragraph) => (
                                <Text
                                    key={paragraph}
                                    className='text-[16px] text-gray-700 mb-4 mt-0 leading-6'
                                >
                                    {paragraph}
                                </Text>
                            ))}

                            <Text className='text-[16px] text-gray-700 mb-0 mt-0 leading-6'>
                                {EMAIL_COPY.signoff.map((line, i) => (
                                    <Fragment key={line}>
                                        {i > 0 && <br />}
                                        {line}
                                    </Fragment>
                                ))}
                            </Text>
                        </Section>

                        <Section className='mt-10 pt-6 border-t border-solid border-gray-200'>
                            <Text className='text-[12px] text-gray-500 m-0 text-center'>
                                {footer}
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

PortfolioConnectionEmail.PreviewProps = {
    name: '{{name}}',
};
