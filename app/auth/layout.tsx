// Force dynamic rendering — prevents prerender crash when env vars are missing
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
