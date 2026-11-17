import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  LogOut,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  formatPrice,
  getStockStatus,
  resolveImage,
  type Category,
  type Product,
} from "@/data/products";
import {
  adminAddProduct,
  adminChangeStock,
  adminLogin,
  adminLogout,
  adminRemoveProduct,
  adminUpdateProduct,
  getAdminStatus,
  getProducts,
} from "@/lib/api/products.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Bikr" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  loader: async () => {
    const { isAdmin } = await getAdminStatus();
    return { isAdmin, products: isAdmin ? await getProducts() : [] };
  },
  component: AdminPage,
});

const CATEGORY_LABEL: Record<Category, string> = {
  women: "Women",
  men: "Men",
  oriental: "Oriental",
};

function AdminPage() {
  const { isAdmin, products } = Route.useLoaderData();
  return (
    <main dir="ltr" className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" />
      {isAdmin ? <Dashboard initialProducts={products} /> : <LoginForm />}
    </main>
  );
}

// ---------------- Login ----------------

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await adminLogin({ data: { username, password } });
      if (!res.ok) {
        setError("Wrong username or password.");
        return;
      }
      await router.invalidate();
    } catch {
      setError("Couldn't sign in. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm border border-border bg-card p-8 space-y-6">
        <div>
          <p className="text-xs tracking-[0.5em] uppercase text-primary mb-3">Bikr</p>
          <h1 className="font-display text-3xl">Admin sign in</h1>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Sign in
        </Button>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-primary">
          ← Back to the shop
        </Link>
      </form>
    </div>
  );
}

// ---------------- Dashboard ----------------

function Dashboard({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const stats = useMemo(
    () => ({
      total: products.length,
      units: products.reduce((n, p) => n + p.stock, 0),
      low: products.filter((p) => getStockStatus(p.stock) === "low").length,
      out: products.filter((p) => p.stock <= 0).length,
    }),
    [products],
  );

  const visible = products.filter((p) => {
    if (filter !== "all" && getStockStatus(p.stock) !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.nameAr ?? "").includes(q);
  });

  const replace = (updated: Product) =>
    setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));

  const changeStock = async (p: Product, change: { delta: number } | { value: number }) => {
    setPending((s) => ({ ...s, [p.id]: true }));
    try {
      replace(await adminChangeStock({ data: { id: p.id, ...change } }));
    } catch (err) {
      toast.error(errorMessage(err));
      if (isAuthError(err)) await router.invalidate();
    } finally {
      setPending((s) => ({ ...s, [p.id]: false }));
    }
  };

  const remove = async (p: Product) => {
    try {
      await adminRemoveProduct({ data: { id: p.id } });
      setProducts((list) => list.filter((x) => x.id !== p.id));
      toast.success(`Removed ${p.name}`);
    } catch (err) {
      toast.error(errorMessage(err));
      if (isAuthError(err)) await router.invalidate();
    }
  };

  const logout = async () => {
    await adminLogout();
    await router.invalidate();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-8 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-xs tracking-[0.5em] uppercase text-primary mb-2">Bikr admin</p>
          <h1 className="font-display text-4xl">Perfumes & stock</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/" target="_blank">
              <ExternalLink /> View shop
            </Link>
          </Button>
          <Button variant="ghost" onClick={logout}>
            <LogOut /> Sign out
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Perfumes" value={stats.total} />
        <Stat label="Units in stock" value={stats.units} />
        <Stat label="Running low" value={stats.low} tone="amber" onClick={() => setFilter("low")} />
        <Stat label="Sold out" value={stats.out} tone="red" onClick={() => setFilter("out")} />
      </section>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search perfumes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex border border-border">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 text-xs uppercase tracking-widest",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : f === "low" ? "Low" : "Sold out"}
            </button>
          ))}
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add perfume
        </Button>
      </div>

      <div className="border border-border divide-y divide-border">
        {visible.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">No perfumes match.</p>
        )}
        {visible.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            busy={!!pending[p.id]}
            onChange={(c) => changeStock(p, c)}
            onDelete={() => setToDelete(p)}
            onEdit={() => setEditing(p)}
          />
        ))}
      </div>

      <ProductDialog
        open={adding || !!editing}
        product={editing}
        onOpenChange={(o) => {
          if (!o) {
            setAdding(false);
            setEditing(null);
          }
        }}
        onSaved={(p, isNew) => {
          if (isNew) setProducts((list) => [...list, p]);
          else replace(p);
          toast.success(isNew ? `Added ${p.name}` : `Saved ${p.name}`);
        }}
        onAuthError={() => router.invalidate()}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from the shop straight away. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => toDelete && remove(toDelete)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "amber" | "red";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="border border-border bg-card p-4 text-left enabled:hover:border-primary transition-colors"
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</p>
      <p
        className={cn(
          "font-display text-3xl",
          tone === "amber" && value > 0 && "text-amber-400",
          tone === "red" && value > 0 && "text-red-400",
        )}
      >
        {value}
      </p>
    </button>
  );
}

function ProductRow({
  product: p,
  busy,
  onChange,
  onDelete,
  onEdit,
}: {
  product: Product;
  busy: boolean;
  onChange: (c: { delta: number } | { value: number }) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const status = getStockStatus(p.stock);

  const commitDraft = () => {
    if (draft === null) return;
    const n = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(n) && n >= 0 && n !== p.stock) onChange({ value: n });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 md:p-4">
      <button type="button" onClick={onEdit} aria-label={`Change photo of ${p.name}`} className="shrink-0">
        <img
          src={resolveImage(p.image)}
          alt=""
          className={cn("w-14 h-16 object-cover bg-card hover:opacity-80", p.stock <= 0 && "grayscale opacity-60")}
        />
      </button>
      <div className="flex-1 min-w-[160px]">
        <Link
          to="/products/$id"
          params={{ id: p.id }}
          target="_blank"
          className="font-display text-xl hover:text-primary"
        >
          {p.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {CATEGORY_LABEL[p.category]} · {formatPrice(p.price)}
          {p.nameAr && <span dir="rtl"> · {p.nameAr}</span>}
        </p>
      </div>

      <span
        className={cn(
          "text-[10px] uppercase tracking-[0.2em] w-20 text-center",
          status === "in" && "text-emerald-400",
          status === "low" && "text-amber-400",
          status === "out" && "text-red-400",
        )}
      >
        {status === "in" ? "In stock" : status === "low" ? "Low" : "Sold out"}
      </span>

      <div className="flex items-center border border-border" aria-busy={busy}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remove one ${p.name}`}
          disabled={busy || p.stock <= 0}
          onClick={() => onChange({ delta: -1 })}
        >
          <Minus />
        </Button>
        <input
          aria-label={`Stock for ${p.name}`}
          inputMode="numeric"
          className="w-14 bg-transparent text-center font-display text-lg outline-none"
          value={draft ?? String(p.stock)}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={commitDraft}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          disabled={busy}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Add one ${p.name}`}
          disabled={busy}
          onClick={() => onChange({ delta: 1 })}
        >
          <Plus />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${p.name}`}
        className="text-muted-foreground hover:text-primary"
        onClick={onEdit}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${p.name}`}
        className="text-muted-foreground hover:text-red-400"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

// ---------------- Add / edit perfume ----------------

const splitList = (s: string) =>
  s
    .split(/[,،]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);

const emptyForm = {
  name: "",
  nameAr: "",
  tagline: "",
  taglineAr: "",
  description: "",
  descriptionAr: "",
  price: "",
  stock: "10",
  category: "women" as Category,
  top: "",
  middle: "",
  base: "",
  topAr: "",
  middleAr: "",
  baseAr: "",
};

const formFromProduct = (p: Product): typeof emptyForm => ({
  name: p.name,
  nameAr: p.nameAr ?? "",
  tagline: p.tagline,
  taglineAr: p.taglineAr ?? "",
  description: p.description,
  descriptionAr: p.descriptionAr ?? "",
  price: String(p.price),
  stock: String(p.stock),
  category: p.category,
  top: p.notes.top.join(", "),
  middle: p.notes.middle.join(", "),
  base: p.notes.base.join(", "),
  topAr: p.notesAr?.top.join("، ") ?? "",
  middleAr: p.notesAr?.middle.join("، ") ?? "",
  baseAr: p.notesAr?.base.join("، ") ?? "",
});

/** Adds a new perfume, or edits `product` when one is given. */
function ProductDialog({
  open,
  product,
  onOpenChange,
  onSaved,
  onAuthError,
}: {
  open: boolean;
  product: Product | null;
  onOpenChange: (o: boolean) => void;
  onSaved: (p: Product, isNew: boolean) => void;
  onAuthError: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState(emptyForm);
  /** A newly picked photo (data URL). null = keep the current one. */
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Fill the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm(product ? formFromProduct(product) : emptyForm);
    setImage(null);
    setError("");
  }, [open, product]);

  const preview = image ?? (product ? resolveImage(product.image) : null);

  const set = (k: keyof typeof emptyForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickImage = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Photo must be JPG, PNG or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const price = Number(form.price);
    const stock = Number.parseInt(form.stock, 10);
    if (!form.name.trim()) return setError("Name is required.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (!Number.isFinite(stock) || stock < 0) return setError("Enter a valid stock number.");

    setBusy(true);
    try {
      if (product) {
        const saved = await adminUpdateProduct({
          data: {
            id: product.id,
            name: form.name,
            nameAr: form.nameAr,
            tagline: form.tagline,
            taglineAr: form.taglineAr,
            description: form.description,
            descriptionAr: form.descriptionAr,
            price,
            category: form.category,
            notes: { top: splitList(form.top), middle: splitList(form.middle), base: splitList(form.base) },
            notesAr: {
              top: splitList(form.topAr),
              middle: splitList(form.middleAr),
              base: splitList(form.baseAr),
            },
            ...(image ? { image } : {}),
          },
        });
        onSaved(saved, false);
        onOpenChange(false);
        return;
      }
      const created = await adminAddProduct({
        data: {
          name: form.name,
          nameAr: form.nameAr,
          tagline: form.tagline,
          taglineAr: form.taglineAr,
          description: form.description,
          descriptionAr: form.descriptionAr,
          price,
          stock,
          category: form.category,
          notes: { top: splitList(form.top), middle: splitList(form.middle), base: splitList(form.base) },
          notesAr: {
            top: splitList(form.topAr),
            middle: splitList(form.middleAr),
            base: splitList(form.baseAr),
          },
          image: image ?? "builtin:0",
        },
      });
      onSaved(created, true);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
      if (isAuthError(err)) onAuthError();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="ltr" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? `Edit ${product.name}` : "Add a perfume"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Changes show in the shop as soon as you save." : "It goes live in the shop as soon as you save."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="flex gap-4 items-start">
            <label className="relative w-28 h-36 shrink-0 border border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary">
              {preview ? (
                <>
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-background/80 py-1 text-center text-[10px] uppercase tracking-widest">
                    Change photo
                  </span>
                </>
              ) : (
                <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  <ImagePlus className="w-5 h-5" /> Photo
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => pickImage(e.target.files?.[0])}
              />
            </label>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <Field label="Name *">
                <Input value={form.name} onChange={set("name")} required maxLength={80} />
              </Field>
              <Field label="Name (Arabic)">
                <Input dir="rtl" value={form.nameAr} onChange={set("nameAr")} maxLength={80} />
              </Field>
              <Field label="Price (EGP) *">
                <Input type="number" min={0} step="0.01" value={form.price} onChange={set("price")} required />
              </Field>
              {!isEdit && (
                <Field label="Stock *">
                  <Input type="number" min={0} step={1} value={form.stock} onChange={set("stock")} required />
                </Field>
              )}
            </div>
          </div>

          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Tagline">
              <Input value={form.tagline} onChange={set("tagline")} maxLength={120} />
            </Field>
            <Field label="Tagline (Arabic)">
              <Input dir="rtl" value={form.taglineAr} onChange={set("taglineAr")} maxLength={120} />
            </Field>
            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={set("description")} maxLength={2000} />
            </Field>
            <Field label="Description (Arabic)">
              <Textarea dir="rtl" rows={3} value={form.descriptionAr} onChange={set("descriptionAr")} maxLength={2000} />
            </Field>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium mb-1">Scent notes (separate with commas)</legend>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Top"><Input value={form.top} onChange={set("top")} placeholder="Bergamot, Pink Pepper" /></Field>
              <Field label="Top (Arabic)"><Input dir="rtl" value={form.topAr} onChange={set("topAr")} /></Field>
              <Field label="Heart"><Input value={form.middle} onChange={set("middle")} placeholder="Rose, Jasmine" /></Field>
              <Field label="Heart (Arabic)"><Input dir="rtl" value={form.middleAr} onChange={set("middleAr")} /></Field>
              <Field label="Base"><Input value={form.base} onChange={set("base")} placeholder="Amber, Musk" /></Field>
              <Field label="Base (Arabic)"><Input dir="rtl" value={form.baseAr} onChange={set("baseAr")} /></Field>
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} {isEdit ? "Save changes" : "Add perfume"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : "Something went wrong.";

const isAuthError = (err: unknown) => errorMessage(err).includes("Not signed in");
