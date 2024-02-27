import { Footer } from '@/app/products/components/footer'
import { Header } from '@/components/header'
import { ProvidersLite } from '../providers-lite'

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="h-fit flex flex-col bg-[url('/gradient-splash.jpg')] bg-top">
      <ProvidersLite>
        <Header />
        <main>{children}</main>
        <Footer />
      </ProvidersLite>
    </div>
  )
}
