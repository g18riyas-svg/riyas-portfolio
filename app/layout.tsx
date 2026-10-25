import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Risme Mohomad Riyas — Full-stack Developer',description:'Custom business systems, web applications and mobile experiences by Risme Mohomad Riyas. Explore selected projects in wellness, fitness, education and retail.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
