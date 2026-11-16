import {
  Activity,
  ArrowDownToLine,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import type { Contact, Page } from "../models";
import { Badge, PageHeading, Stat } from "../components/Shared";

type ContactsListPageProps = {
  contacts: Contact[];
  categories: string[];
  filtered: Contact[];
  visibleContacts: Contact[];
  selectedVisible: string[];
  selected: string[];
  contactsLoading: boolean;
  contactsError: string;
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  setModal: (value: string) => void;
  exportCsv: (rows?: Contact[]) => void;
  exportExcel: (rows?: Contact[]) => Promise<void>;
  go: (page: Page) => void;
  openAudienceBuilder: (members?: Contact[]) => void;
  setBulkDeletePhrase: (value: string) => void;
  setConfirmBulkDelete: (value: boolean) => void;
  contactsReload: () => void;
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  toggle: (email: string) => void;
  openContactProfile: (contact: Contact) => void;
  contactsPage: number;
  pageSize: number;
  pageCount: number;
  setContactsPage: React.Dispatch<React.SetStateAction<number>>;
};
export function ContactsListPage({
  contacts,
  categories,
  filtered,
  visibleContacts,
  selectedVisible,
  selected,
  contactsLoading,
  contactsError,
  query,
  setQuery,
  category,
  setCategory,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  setModal,
  exportCsv,
  exportExcel,
  go,
  openAudienceBuilder,
  setBulkDeletePhrase,
  setConfirmBulkDelete,
  contactsReload,
  setSelected,
  toggle,
  openContactProfile,
  contactsPage,
  pageSize,
  pageCount,
  setContactsPage,
}: ContactsListPageProps) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR PEOPLE, ALL IN ONE PLACE"
        title="Contacts"
        desc="Manage your relationships and keep every conversation personal."
        action={
          <>
            <button className="btn secondary" onClick={() => exportCsv()}>
              <ArrowDownToLine size={16} /> Export
            </button>
            <button
              className="btn secondary"
              onClick={() => void exportExcel()}
            >
              <ArrowDownToLine size={16} /> Excel
            </button>
            <button className="btn secondary" onClick={() => go("Categories")}>
              <Tag size={15} /> Manage categories
            </button>
            <button className="btn primary" onClick={() => setModal("add")}>
              <Plus size={17} /> Add contact
            </button>
          </>
        }
      />
      <div className="stats-grid compact-stats">
        <Stat
          icon={<ContactRound />}
          label="Total contacts"
          value={String(contacts.length)}
          change="Live"
          hint="saved contact records"
          color="lav"
        />
        <Stat
          icon={<CheckCheck />}
          label="Subscribed"
          value={String(
            contacts.filter((c) => c.status === "Subscribed").length,
          )}
          change="Live"
          hint="saved records"
          color="green"
        />
        <Stat
          icon={<ShieldCheck />}
          label="SMS opted in"
          value={String(
            contacts.filter((c) => c.smsStatus === "Subscribed").length,
          )}
          change="Live"
          hint="saved SMS opt-ins"
          color="orange"
        />
        <Stat
          icon={<Users />}
          label="Categories"
          value={String(categories.length)}
          change="Live"
          hint="available categories"
          color="blue"
        />
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Contacts{" "}
              <span className="light-count">{filtered.length} shown</span>
            </h2>
            <p>Search, filter, and manage contact records saved in your CRM.</p>
          </div>
        </div>
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              id="contact-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or location"
            />
            <kbd>⌘ K</kbd>
          </div>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All statuses</option>
            <option>Subscribed</option>
            <option>Pending</option>
            <option>Unsubscribed</option>
          </select>
          <select
            aria-label="Sort contacts"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option>Recently added</option>
            <option>Name A–Z</option>
          </select>
          <button
            className="btn secondary import-btn"
            onClick={() => setModal("import")}
          >
            <Plus size={15} /> Import CSV / Excel
          </button>
        </div>
        {selectedVisible.length > 0 && (
          <div className="selection-bar">
            <span>{selectedVisible.length} selected</span>
            <button
              onClick={() =>
                openAudienceBuilder(
                  filtered.filter((c) => selectedVisible.includes(c.email)),
                )
              }
            >
              Create static audience
            </button>
            <button
              onClick={() =>
                exportCsv(
                  filtered.filter((c) => selectedVisible.includes(c.email)),
                )
              }
            >
              Export selected
            </button>
            <button
              className="bulk-delete-action"
              onClick={() => {
                setBulkDeletePhrase("");
                setConfirmBulkDelete(true);
              }}
            >
              Delete selected
            </button>
            <button onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
        <div className="table-scroll">
          {contactsLoading ? (
            <div className="empty-state">
              <LoaderCircle size={20} className="auth-spinner" />
              <b>Loading CRM contacts</b>
              <span>Fetching contacts and categories from the API.</span>
            </div>
          ) : contactsError ? (
            <div className="empty-state" role="alert">
              <Activity size={20} />
              <b>Contacts could not be loaded</b>
              <span>{contactsError}</span>
              <button className="btn secondary" onClick={contactsReload}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        aria-label="Select all visible contacts"
                        type="checkbox"
                        checked={
                          visibleContacts.length > 0 &&
                          visibleContacts.every((c) =>
                            selectedVisible.includes(c.email),
                          )
                        }
                        onChange={() =>
                          setSelected(
                            visibleContacts.every((c) =>
                              selectedVisible.includes(c.email),
                            )
                              ? selected.filter(
                                  (email) =>
                                    !visibleContacts.some(
                                      (c) => c.email === email,
                                    ),
                                )
                              : [
                                  ...new Set([
                                    ...selected,
                                    ...visibleContacts.map((c) => c.email),
                                  ]),
                                ],
                          )
                        }
                      />
                    </th>
                    <th>CONTACT</th>
                    <th>CATEGORY</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                    <th>ADDED</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleContacts.map((c) => (
                    <tr key={c.email}>
                      <td>
                        <input
                          aria-label={`Select ${c.name}`}
                          type="checkbox"
                          checked={selected.includes(c.email)}
                          onChange={() => toggle(c.email)}
                        />
                      </td>
                      <td>
                        <button
                          className="contact-open"
                          onClick={() => openContactProfile(c)}
                          aria-label={`View ${c.name}'s profile`}
                        >
                          <div className="contact-cell">
                            <div className={`avatar ${c.color}`}>
                              {c.initials}
                            </div>
                            <div>
                              <b>{c.name}</b>
                              <small>{c.email}</small>
                            </div>
                          </div>
                        </button>
                      </td>
                      <td>
                        <Badge tone="neutral">{c.category}</Badge>
                      </td>
                      <td>{c.location}</td>
                      <td>
                        <Badge tone={c.status}>{c.status}</Badge>
                      </td>
                      <td>{c.date}</td>
                      <td>
                        <button
                          className="icon-btn row-menu"
                          aria-label={`More options for ${c.name}`}
                          onClick={() => openContactProfile(c)}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && !contactsLoading && !contactsError && (
                <div className="empty-state">
                  {contacts.length === 0 ? (
                    <ContactRound size={20} />
                  ) : (
                    <Search size={20} />
                  )}
                  <b>
                    {contacts.length === 0
                      ? "No contacts yet"
                      : "No contacts match these filters"}
                  </b>
                  <span>
                    {contacts.length === 0
                      ? "Add your first contact or import a contact file to get started."
                      : "Change your search or clear a filter to see contacts."}
                  </span>
                  {contacts.length === 0 ? (
                    <button
                      className="btn primary"
                      onClick={() => setModal("add")}
                    >
                      <Plus size={15} /> Add contact
                    </button>
                  ) : (
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setQuery("");
                        setCategory("All categories");
                        setStatusFilter("All statuses");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="table-footer">
          <span>
            Showing{" "}
            <b>
              {filtered.length === 0 ? 0 : contactsPage * pageSize + 1}–
              {Math.min((contactsPage + 1) * pageSize, filtered.length)}
            </b>{" "}
            of {filtered.length} contacts
          </span>
          <div>
            <button
              className="page-btn"
              disabled={contactsPage <= 0 || contactsLoading}
              onClick={() => setContactsPage((page) => Math.max(0, page - 1))}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="page-count">
              {contactsPage + 1} / {pageCount}
            </span>
            <button
              className="page-btn"
              disabled={contactsPage >= pageCount - 1 || contactsLoading}
              onClick={() =>
                setContactsPage((page) => Math.min(pageCount - 1, page + 1))
              }
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
