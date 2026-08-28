import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            { title: 'Portfolio' },
        ],
        links: [
            {
                rel: 'stylesheet',
                href: appCss,
            },
        ],
    }),

    shellComponent: RootDocument,
});

// Devtools come from devDependencies and used to render unconditionally,
// shipping the panel to production. `import.meta.env.DEV` is statically
// replaced at build time, so the dynamic import below is dropped entirely
// from the production bundle rather than merely hidden.
const Devtools = import.meta.env.DEV
    ? lazy(async () => {
          const [{ TanStackDevtools }, { TanStackRouterDevtoolsPanel }] =
              await Promise.all([
                  import('@tanstack/react-devtools'),
                  import('@tanstack/react-router-devtools'),
              ]);

          return {
              default: () => (
                  <TanStackDevtools
                      config={{ position: 'bottom-right' }}
                      plugins={[
                          {
                              name: 'Tanstack Router',
                              render: <TanStackRouterDevtoolsPanel />,
                          },
                      ]}
                  />
              ),
          };
      })
    : null;

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en'>
            <head>
                <HeadContent />
            </head>
            <body>
                <TooltipProvider>{children}</TooltipProvider>
                {Devtools && (
                    <Suspense fallback={null}>
                        <Devtools />
                    </Suspense>
                )}
                <Scripts />
            </body>
        </html>
    );
}
