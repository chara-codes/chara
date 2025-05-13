"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Simple component with minimal structure
export function SimpleComponent() {
  return (
    <div className="p-4 border rounded-md bg-gray-50" data-testid="SimpleComponent">
      <h3 className="text-lg font-medium">Simple Component</h3>
      <p className="text-sm text-gray-500">This is a basic component with minimal nesting</p>
    </div>
  )
}

// Nested component with multiple levels
export function NestedComponent() {
  return (
    <div className="border rounded-md p-4 bg-blue-50" data-testid="NestedComponent">
      <h3 className="text-lg font-medium">Nested Component</h3>
      <div className="mt-2">
        <ChildComponent title="First Child" />
        <ChildComponent title="Second Child">
          <GrandchildComponent />
        </ChildComponent>
      </div>
    </div>
  )
}

// Child component used within NestedComponent
function ChildComponent({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border rounded p-2 mt-2 bg-white" data-testid="ChildComponent">
      <h4 className="font-medium">{title}</h4>
      {children}
    </div>
  )
}

// Grandchild component used within ChildComponent
function GrandchildComponent() {
  return (
    <div className="border-l-4 border-blue-500 pl-2 mt-2" data-testid="GrandchildComponent">
      <p className="text-sm">Grandchild component</p>
      <Badge>Deeply Nested</Badge>
    </div>
  )
}

// Interactive component with state
export function InteractiveComponent() {
  const [count, setCount] = useState(0)

  return (
    <div className="border rounded-md p-4 bg-green-50" data-testid="InteractiveComponent">
      <h3 className="text-lg font-medium">Interactive Component</h3>
      <p className="text-sm mb-2">Count: {count}</p>
      <div className="flex space-x-2">
        <Button size="sm" onClick={() => setCount(count - 1)}>
          Decrease
        </Button>
        <Button size="sm" onClick={() => setCount(count + 1)}>
          Increase
        </Button>
      </div>
    </div>
  )
}

// Complex component with multiple UI elements
export function ComplexComponent() {
  return (
    <Card className="w-full" data-testid="ComplexComponent">
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="john@example.com" />
            </div>
          </TabsContent>
          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select id="theme" className="w-full p-2 border rounded">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}

// Component with a grid layout
export function GridComponent() {
  return (
    <div className="border rounded-md p-4 bg-purple-50" data-testid="GridComponent">
      <h3 className="text-lg font-medium mb-2">Grid Component</h3>
      <div className="grid grid-cols-2 gap-2">
        <GridItem title="Item 1" color="bg-red-100" />
        <GridItem title="Item 2" color="bg-blue-100" />
        <GridItem title="Item 3" color="bg-green-100" />
        <GridItem title="Item 4" color="bg-yellow-100" />
      </div>
    </div>
  )
}

// Grid item component
function GridItem({ title, color }: { title: string; color: string }) {
  return (
    <div className={`p-3 rounded ${color}`} data-testid="GridItem">
      <h5 className="font-medium">{title}</h5>
      <p className="text-xs">Grid item component</p>
    </div>
  )
}
