"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";

const EXPECTED_HEADERS = [
  "name",
  "price",
  "sku",
  "compareAtPrice",
  "costPrice",
  "manufacturer",
  "weight",
  "shortDescription",
  "description",
  "tags",
  "allergens",
  "ingredients",
  "isActive",
  "isFeatured",
  "isGiftEligible",
  "stock",
];

const SAMPLE_DATA = [
  "name\tsku\tprice\tcostPrice\tweight\tshortDescription\ttags\tallergens\tisActive\tstock",
  "Dark Chocolate Bar\tCHOC-100\t9.99\t3.50\t4\tRich 70% dark chocolate\tbestseller,vegan\tsoy\ttrue\t50",
  "Mint Gummy Bears\tGUM-100\t6.99\t2.00\t8\tRefreshing mint gummies\tnew,vegan\t\ttrue\t100",
].join("\n");

function parseTSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split("\t").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split("\t");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || "").trim();
    });
    return row;
  });

  return { headers, rows };
}

export default function BulkImportPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const { headers, rows } = parseTSV(input);
  const isValid = rows.length > 0 && headers.includes("name") && headers.includes("price");

  const handleImport = async () => {
    if (!isValid) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setResult(data);
      if (data.imported > 0) {
        toast.success(`${data.imported} product(s) imported`);
      }
      if (data.errors?.length > 0) {
        toast.error(`${data.errors.length} row(s) had errors`);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const loadSample = () => setInput(SAMPLE_DATA);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/products")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">
            Bulk Import Products
          </h1>
          <p className="text-sm text-brand-text-muted">
            Paste tab-delimited data (e.g. from a spreadsheet) with headers in
            the first row
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Expected format */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Data Format</h2>
            <Button variant="outline" size="sm" onClick={loadSample}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Load Sample
            </Button>
          </div>
          <p className="text-sm text-brand-text-muted mb-3">
            First row must be headers. Required columns:{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">name</code>,{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">price</code>.
            SKU is auto-generated if omitted (format: CATG-PROD-0001).
            Optional columns:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXPECTED_HEADERS.filter(
              (h) => !["name", "price"].includes(h)
            ).map((h) => (
              <span
                key={h}
                className="text-xs bg-gray-100 text-brand-text-muted px-2 py-0.5 rounded"
              >
                {h}
              </span>
            ))}
          </div>
          <p className="text-xs text-brand-text-muted mt-3">
            Tags and allergens: comma-separated within the field. Boolean fields
            (isActive, isFeatured, isGiftEligible): use &quot;true&quot; or
            &quot;false&quot;.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading font-semibold mb-3">
            Paste Data
          </h2>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResult(null);
            }}
            rows={12}
            placeholder="name&#9;sku&#9;price&#9;weight&#9;...&#10;Dark Chocolate&#9;CHOC-100&#9;9.99&#9;4&#9;..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            spellCheck={false}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-brand-text-muted">
              {rows.length > 0 ? (
                <>
                  {rows.length} row(s) detected &middot; {headers.length}{" "}
                  column(s)
                  {!isValid && (
                    <span className="text-red-500 ml-2">
                      Missing required columns (name, sku, price)
                    </span>
                  )}
                </>
              ) : (
                "Paste tab-delimited data above"
              )}
            </p>
            <Button
              onClick={handleImport}
              disabled={importing || !isValid}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importing..." : `Import ${rows.length} Product(s)`}
            </Button>
          </div>
        </div>

        {/* Preview */}
        {isValid && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold mb-3">Preview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-2 py-2 text-left font-medium text-brand-text-muted">
                      #
                    </th>
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="px-2 py-2 text-left font-medium text-brand-text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1.5 text-brand-text-muted">
                        {i + 1}
                      </td>
                      {headers.map((h) => (
                        <td key={h} className="px-2 py-1.5 max-w-[200px] truncate">
                          {row[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length > 20 && (
                    <tr>
                      <td
                        colSpan={headers.length + 1}
                        className="px-2 py-2 text-center text-brand-text-muted"
                      >
                        ... and {rows.length - 20} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold mb-3">Import Results</h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-green-600 font-medium">
                  {result.imported} imported
                </span>
                {result.errors.length > 0 && (
                  <span className="text-red-500 font-medium ml-3">
                    {result.errors.length} failed
                  </span>
                )}
              </p>
              {result.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
