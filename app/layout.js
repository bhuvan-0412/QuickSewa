import { Inter, Noto_Sans_Telugu, Poppins } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./lib/language";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto-telugu",
  display: "swap",
});

export const metadata = {
  title: "QuickSewa — Report Civic Issues in Hyderabad",
  description:
    "One tap to report potholes, garbage, broken streetlights and more directly to GHMC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${notoTelugu.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(l) {
                if (l.search[1] === 'p') {
                  var decoded = l.search.slice(1).split('&').map(function(s) {
                    return s.replace(/~and~/g, '&')
                  }).reduce(function(r, q) {
                    var nameVal = q.split('=');
                    r[nameVal[0]] = nameVal[1];
                    return r;
                  }, {});
                  if (decoded.p !== undefined) {
                    window.history.replaceState(null, null,
                      l.pathname.slice(0, -1) + (decoded.p ? '/' + decoded.p : '') +
                      (decoded.q ? '?' + decoded.q : '') +
                      l.hash
                    );
                  }
                }
              }(window.location));
            `,
          }}
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
