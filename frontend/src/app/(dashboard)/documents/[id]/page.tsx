"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useDocumentStore } from "@/features/documents/stores/documentStore";

const CollaborativeEditor = dynamic(() => import("@/components/documents/collaborative-editor").then(m => ({ default: m.CollaborativeEditor })), { loading: () => <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div> });

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.id as string;
  const { currentDocument, fetchDocument, error } = useDocumentStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchDocument(documentId).then(() => setReady(true));
  }, [documentId, fetchDocument]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !currentDocument) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-red-400">{error || "Document not found"}</p>
          <button
            onClick={() => window.history.back()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return <CollaborativeEditor documentId={documentId} />;
}
