"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/types";

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
  pendingItem: { item: Omit<CartItem, "quantity">; quantity: number } | null;
}

export function AuthPromptModal({ open, onClose, pendingItem }: AuthPromptModalProps) {
  const [mode, setMode] = useState<"choose" | "login" | "register">("choose");
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setOpen);
  const router = useRouter();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [reg, setReg] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    acceptTerms: false,
  });

  const addPendingItem = () => {
    if (pendingItem) {
      addItem(pendingItem.item, pendingItem.quantity);
      setCartOpen(true);
      toast.success(`${pendingItem.item.name} added to cart`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        addPendingItem();
        onClose();
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reg.password !== reg.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!reg.acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reg.name,
          email: reg.email,
          password: reg.password,
          address: {
            line1: reg.line1,
            line2: reg.line2,
            city: reg.city,
            state: reg.state,
            zip: reg.zip,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Registration failed");
        return;
      }

      // Auto-login after registration
      const loginResult = await signIn("credentials", {
        email: reg.email,
        password: reg.password,
        redirect: false,
      });

      if (loginResult?.error) {
        toast.success("Account created! Please log in.");
        setMode("login");
        setLoginEmail(reg.email);
      } else {
        toast.success("Account created! Check your email to verify.");
        addPendingItem();
        onClose();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode("choose");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {mode === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Sign in to continue</DialogTitle>
            </DialogHeader>
            <p className="text-center text-sm text-brand-text-muted mb-4">
              Create an account or sign in to add items to your cart.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setMode("login")}
                className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-11"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("register")}
                className="w-full h-11"
              >
                Create Account
              </Button>
            </div>
          </>
        )}

        {mode === "login" && (
          <>
            <DialogHeader>
              <DialogTitle>Sign In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-11"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-brand-text-muted">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-brand-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          </>
        )}

        {mode === "register" && (
          <>
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={reg.name}
                  onChange={(e) => setReg({ ...reg, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={reg.password}
                    onChange={(e) => setReg({ ...reg, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm *</Label>
                  <Input
                    type="password"
                    value={reg.confirmPassword}
                    onChange={(e) => setReg({ ...reg, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Shipping Address</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Address Line 1 *</Label>
                    <Input
                      value={reg.line1}
                      onChange={(e) => setReg({ ...reg, line1: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={reg.line2}
                      onChange={(e) => setReg({ ...reg, line2: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        value={reg.city}
                        onChange={(e) => setReg({ ...reg, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input
                        value={reg.state}
                        onChange={(e) => setReg({ ...reg, state: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP *</Label>
                      <Input
                        value={reg.zip}
                        onChange={(e) => setReg({ ...reg, zip: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reg.acceptTerms}
                  onChange={(e) => setReg({ ...reg, acceptTerms: e.target.checked })}
                  className="mt-1 rounded border-gray-300"
                />
                <span className="text-sm text-brand-text-secondary">
                  I agree to the{" "}
                  <a
                    href="/terms-and-conditions"
                    target="_blank"
                    className="text-brand-primary hover:underline"
                  >
                    Terms and Conditions
                  </a>
                </span>
              </label>

              <Button
                type="submit"
                disabled={loading || !reg.acceptTerms}
                className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-11"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-center text-sm text-brand-text-muted">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-brand-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
