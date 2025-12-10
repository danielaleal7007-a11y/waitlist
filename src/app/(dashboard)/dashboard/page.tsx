import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Package
} from 'lucide-react'

const categories = [
  { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { name: 'TikTok', icon: Package, color: 'bg-gradient-to-br from-gray-900 to-gray-700' },
  { name: 'YouTube', icon: Youtube, color: 'bg-gradient-to-br from-red-600 to-red-700' },
  { name: 'Facebook', icon: Facebook, color: 'bg-gradient-to-br from-blue-600 to-blue-700' },
  { name: 'Twitter', icon: Twitter, color: 'bg-gradient-to-br from-sky-400 to-sky-600' },
  { name: 'Telegram', icon: Package, color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
]

const stats = [
  { label: 'Total Orders', value: '0', icon: ShoppingCart },
  { label: 'Wallet Balance', value: '$0.00', icon: Wallet },
  { label: 'Active Services', value: '0', icon: Package },
  { label: 'Growth Rate', value: '0%', icon: TrendingUp },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              SMM Panel
            </h1>
            <nav className="hidden md:flex gap-6">
              <a href="/dashboard" className="text-sm font-medium hover:text-purple-600 transition-colors">
                Dashboard
              </a>
              <a href="/services" className="text-sm font-medium hover:text-purple-600 transition-colors">
                Services
              </a>
              <a href="/orders" className="text-sm font-medium hover:text-purple-600 transition-colors">
                Orders
              </a>
              <a href="/tickets" className="text-sm font-medium hover:text-purple-600 transition-colors">
                Support
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Wallet className="w-4 h-4 mr-2" />
              Add Funds
            </Button>
            <Button size="sm">Sign In</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to SMM Panel</h2>
          <p className="text-muted-foreground">
            Choose a platform below to explore our services
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Platform</CardTitle>
            <CardDescription>
              Choose your social media platform to view available services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <button
                  key={category.name}
                  className="group relative overflow-hidden rounded-lg p-6 text-white transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className={`absolute inset-0 ${category.color}`} />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <category.icon className="w-8 h-8" />
                    <span className="text-sm font-semibold">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Fast Delivery</CardTitle>
              <CardDescription>
                Orders start processing immediately and deliver within hours
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">24/7 Support</CardTitle>
              <CardDescription>
                Our support team is always ready to help you with any questions
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Secure Payment</CardTitle>
              <CardDescription>
                Multiple payment options with secure checkout and instant credits
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 SMM Panel. All rights reserved.</p>
          <p className="mt-2">
            <a href="/terms" className="hover:text-purple-600 transition-colors">Terms</a>
            {' · '}
            <a href="/privacy" className="hover:text-purple-600 transition-colors">Privacy</a>
            {' · '}
            <a href="/api-docs" className="hover:text-purple-600 transition-colors">API</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
