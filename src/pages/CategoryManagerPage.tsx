import { useState } from "react";
import { ChevronLeft, LoaderCircle, Plus, X } from "lucide-react";
import type { Contact } from "../models";
import {
  DeletePhraseInput,
  PageHeading,
  deletePhraseMatches,
} from "../components/Shared";

export function CategoryManager({
  categories,
  contacts,
  loading,
  loadError,
  retry,
  onBack,
  onCreate,
  onRename,
  onDelete,
}: {
  categories: string[];
  contacts: Contact[];
  loading: boolean;
  loadError: string;
  retry: () => void;
  onBack: () => void;
  onCreate: (name: string) => Promise<string | null>;
  onRename: (previous: string, next: string) => Promise<string | null>;
  onDelete: (name: string) => Promise<string | null>;
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState("");
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState("");
  const [deletePhrase, setDeletePhrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isDuplicate = (candidate: string, except = "") =>
    categories.some(
      (name) =>
        name.toLocaleLowerCase() !== except.toLocaleLowerCase() &&
        name.toLocaleLowerCase() === candidate.toLocaleLowerCase(),
    );
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const value = newName.trim();
    if (!value) return setError("Enter a category name.");
    if (isDuplicate(value))
      return setError("A category with this name already exists.");
    setBusy(true);
    try {
      const failure = await onCreate(value);
      if (failure) return setError(failure);
      setNewName("");
      setError("");
    } finally {
      setBusy(false);
    }
  };
  const saveRename = async (previous: string) => {
    if (busy) return;
    const value = editValue.trim();
    if (!value) return setError("Enter a category name.");
    if (isDuplicate(value, previous))
      return setError("A category with this name already exists.");
    if (value === previous) {
      setEditing("");
      setError("");
      return;
    }
    setBusy(true);
    try {
      const failure = await onRename(previous, value);
      if (failure) return setError(failure);
      setEditing("");
      setError("");
    } finally {
      setBusy(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget || busy || !deletePhraseMatches(deletePhrase)) return;
    setBusy(true);
    try {
      const failure = await onDelete(deleteTarget);
      if (failure) return setError(failure);
      setDeleteTarget("");
      setDeletePhrase("");
      setError("");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="category-manager-page">
      <PageHeading
        eyebrow="CONTACT ORGANIZATION"
        title="Categories"
        desc="Create and maintain the categories used to organize your contacts."
        action={
          <button className="btn secondary" onClick={onBack}>
            <ChevronLeft size={16} /> Back to contacts
          </button>
        }
      />
      <form className="panel category-create-form" onSubmit={add}>
        <div>
          <h2>Create a category</h2>
          <p>
            New categories are immediately available on contact records and
            filters.
          </p>
        </div>
        <label className="category-create-input">
          <span className="sr-only">Category name</span>
          <input
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setError("");
            }}
            placeholder="e.g. Volunteer"
            maxLength={48}
            disabled={busy}
          />
        </label>
        <button
          className="btn primary"
          type="submit"
          disabled={busy || loading || Boolean(loadError)}
        >
          {busy ? (
            <LoaderCircle size={16} className="auth-spinner" />
          ) : (
            <Plus size={16} />
          )}{" "}
          {busy ? "Saving…" : "Add category"}
        </button>
      </form>
      {error && (
        <p className="validation-message category-error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <div className="empty-state">
          <LoaderCircle size={18} className="auth-spinner" />
          <span>Loading contact categories…</span>
        </div>
      )}
      {loadError && (
        <div className="empty-state" role="alert">
          <b>Categories could not be loaded</b>
          <span>{loadError}</span>
          <button className="btn secondary" onClick={retry}>
            Retry
          </button>
        </div>
      )}
      <section className="panel category-list-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Contact categories{" "}
              <span className="light-count">{categories.length}</span>
            </h2>
            <p>
              Renaming a category updates contacts and saved audience rules.
            </p>
          </div>
        </div>
        <div className="category-list">
          {!loading && !loadError && categories.length === 0 && (
            <div className="empty-state">
              <b>No categories yet</b>
              <span>Create a category to organize contacts.</span>
            </div>
          )}
          {!loading &&
            !loadError &&
            categories.map((name) => {
              const usage = contacts.filter(
                (contact) => contact.category === name,
              ).length;
              return (
                <div className="category-row" key={name}>
                  {editing === name ? (
                    <>
                      <input
                        aria-label={`Rename ${name}`}
                        value={editValue}
                        disabled={busy}
                        onChange={(event) => {
                          setEditValue(event.target.value);
                          setError("");
                        }}
                        maxLength={48}
                      />
                      <span className="category-usage">{usage} contacts</span>
                      <button
                        className="btn primary"
                        onClick={() => void saveRename(name)}
                        disabled={busy}
                      >
                        {busy ? "Saving…" : "Save"}
                      </button>
                      <button
                        className="btn secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditing("");
                          setError("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="category-name">
                        <span className="category-dot" />
                        <b>{name}</b>
                      </div>
                      <span className="category-usage">
                        {usage} contact{usage === 1 ? "" : "s"}
                      </span>
                      <button
                        className="btn secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditing(name);
                          setEditValue(name);
                          setError("");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger-quiet"
                        disabled={categories.length <= 1 || busy}
                        onClick={() => {
                          setDeleteTarget(name);
                          setDeletePhrase("");
                          setError("");
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </section>
      {deleteTarget && (
        <div
          className="category-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="category-confirm-card">
            <div className="danger-icon">
              <X size={18} />
            </div>
            <h2 id="delete-category-title">Delete “{deleteTarget}”?</h2>
            <p>
              {
                contacts.filter((contact) => contact.category === deleteTarget)
                  .length
              }{" "}
              assigned contacts will be moved to{" "}
              {categories.find((categoryName) => categoryName !== deleteTarget)}
              . Saved audience rules that use this category will be updated too.
            </p>
            <DeletePhraseInput
              value={deletePhrase}
              onChange={setDeletePhrase}
              disabled={busy}
            />
            <div className="category-confirm-actions">
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => {
                  setDeleteTarget("");
                  setDeletePhrase("");
                }}
              >
                Keep category
              </button>
              <button
                className="btn danger"
                disabled={busy || !deletePhraseMatches(deletePhrase)}
                onClick={() => void confirmDelete()}
              >
                {busy ? "Deleting..." : "Delete category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
