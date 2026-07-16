"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store";
import { Settings, LogOut, Save, Loader2, User, Check, Sun, Moon, Monitor } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  const handleSave = async () => {
    setSaving(true);
    // Simulate save (no backend endpoint for profile update yet)
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = firstName !== (user?.firstName || "") || lastName !== (user?.lastName || "");

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-xl font-bold text-primary">
                    {user ? getInitials(`${user.firstName} ${user.lastName}`) : "SS"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg">{user?.firstName} {user?.lastName}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="h-11 opacity-60"
                />
                <p className="text-xs text-muted-foreground">Email is managed by your GitHub account</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saved ? "Saved" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div>
                  <p className="text-sm font-medium">Sign Out</p>
                  <p className="text-xs text-muted-foreground">Sign out from your account</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    logout();
                    window.location.href = "/login";
                  }}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {[
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                        theme === option.value
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-surface-sunken border border-border-subtle hover:bg-surface-hover text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
