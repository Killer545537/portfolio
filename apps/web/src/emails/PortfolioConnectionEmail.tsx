import {
    Body,
    Container,
    Head,
    Html,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

interface PortfolioConnectionEmailProps {
    name: string;
}

export function PortfolioConnectionEmail({
    name,
}: PortfolioConnectionEmailProps) {
    return (
        <Html lang='en' dir='ltr'>
            <Tailwind>
                <Head />
                <Body className='bg-gray-100 font-sans py-10'>
                    <Container className='bg-white rounded-xl p-8 max-w-150 mx-auto'>
                        <Section>
                            <Text className='text-[18px] font-bold text-gray-900 mb-6 mt-0'>
                                Hi {name},
                            </Text>

                            <Text className='text-[16px] text-gray-700 mb-4 mt-0 leading-6'>
                                Thanks for reaching out through my portfolio. I
                                appreciate you taking the time to connect.
                            </Text>

                            <Text className='text-[16px] text-gray-700 mb-4 mt-0 leading-6'>
                                I'm Srijan, a full-stack developer who focuses
                                on systems architecture, backend development,
                                and building performance-oriented software. I
                                enjoy tackling complex technical challenges and
                                creating solutions that scale effectively.
                            </Text>

                            <Text className='text-[16px] text-gray-700 mb-6 mt-0 leading-6'>
                                Feel free to reply if you'd like to discuss
                                potential collaboration, interesting projects,
                                or opportunities. I'd be happy to hear what
                                you're working on.
                            </Text>

                            <Text className='text-[16px] text-gray-700 mb-0 mt-0 leading-6'>
                                Best regards,
                                <br />
                                Srijan Mahajan
                            </Text>
                        </Section>

                        <Section className='mt-10 pt-6 border-t border-solid border-gray-200'>
                            <Text className='text-[12px] text-gray-500 m-0 text-center'>
                                This email was sent because you connected
                                through srijanmahajan.me
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

export default PortfolioConnectionEmail;
