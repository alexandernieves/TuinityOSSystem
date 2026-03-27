import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="p-8 space-y-8 bg-background text-foreground min-h-screen">
      <h1 className="text-3xl font-bold mb-6">shadcn/ui Theming System</h1>
      
      {/* Button Variants */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>Using semantic color variables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Default</p>
              <Button>Click me</Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Secondary</p>
              <Button variant="secondary">Secondary</Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Outline</p>
              <Button variant="outline">Outline</Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ghost</p>
              <Button variant="ghost">Ghost</Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Destructive</p>
              <Button variant="destructive">Destructive</Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Link</p>
              <Button variant="link">Link</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Sizes */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Button Sizes</CardTitle>
          <CardDescription>Different size variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🔥</Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Loading State</CardTitle>
          <CardDescription>Buttons with loading indicator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button isLoading>Loading</Button>
            <Button variant="secondary" isLoading>Processing</Button>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors Demo */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Brand Colors (Blue Palette)</CardTitle>
          <CardDescription>Using the brand color variables from memory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-lg mb-2 border border-border"></div>
              <p className="text-xs text-muted-foreground">Blue 50</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-200 rounded-lg mb-2 border border-border"></div>
              <p className="text-xs text-muted-foreground">Blue 200</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-400 rounded-lg mb-2 border border-border"></div>
              <p className="text-xs text-muted-foreground">Blue 400</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg mb-2 border border-border"></div>
              <p className="text-xs text-muted-foreground">Blue 600</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-800 rounded-lg mb-2 border border-border"></div>
              <p className="text-xs text-muted-foreground">Blue 800</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Semantic Colors</CardTitle>
          <CardDescription>Success, Warning, Info, Danger states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-success-bg rounded-lg mb-2 border border-border flex items-center justify-center">
                <div className="w-8 h-8 bg-success rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning-bg rounded-lg mb-2 border border-border flex items-center justify-center">
                <div className="w-8 h-8 bg-warning rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground">Warning</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-info-bg rounded-lg mb-2 border border-border flex items-center justify-center">
                <div className="w-8 h-8 bg-info rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground">Info</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-danger-bg rounded-lg mb-2 border border-border flex items-center justify-center">
                <div className="w-8 h-8 bg-destructive rounded-full"></div>
              </div>
              <p className="text-xs text-muted-foreground">Danger</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode Preview */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Dark Mode Support</CardTitle>
          <CardDescription>All components support dark mode automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Toggle dark mode in your browser/system settings to see the theme adapt automatically using CSS variables.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
