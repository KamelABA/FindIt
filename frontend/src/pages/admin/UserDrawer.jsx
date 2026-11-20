import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import Drawer, { DetailRow, DrawerSection } from "../../components/admin/Drawer";
import ActionBar, { ActionError } from "../../components/admin/ActionBar";
import StatusChip from "../../components/admin/StatusChip";
import ItemStatusBadge from "../../components/ItemStatusBadge";
import Icon from "../../components/Icon";
import { Spinner, ErrorState } from "../../components/StateMessages";
import { getUser, userAction, setUserRole } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n, errorText } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAdmin, isSuperAdmin } from "./AdminLayout";
import { useAction, formatDateTime } from "./hooks";

const ROLES = ["student", "admin", "super_admin"];

/** Super admins only: change the account's role (use case "Manage Admins, Roles"). */
function RoleSection({ user, busy, onChange }) {
  const { t } = useI18n();
  const selectId = useId();
  const [role, setRole] = useState(user.role);
  useEffect(() => setRole(user.role), [user.role]);
  const canBeStaff = user.registration_status === "approved" && !user.is_suspended;

  return (
    <DrawerSection title={t("admin.roles.title")}>
      <p className="mb-3 text-sm text-muted">{t("admin.roles.hint")}</p>
      <label htmlFor={selectId} className="sr-only">{t("admin.roles.title")}</label>
      <select
        id={selectId}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={busy}
        className="w-full rounded-xl border border-ink/15 bg-surface px-3 py-2.5 text-sm font-medium text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
      >
        {ROLES.map((r) => (
          <option key={r} value={r} disabled={r !== "student" && !canBeStaff}>
            {t(`admin.status.${r}`)} — {t(`admin.roles.describe.${r}`)}
          </option>
        ))}
      </select>
      {!canBeStaff && user.role === "student" && <p className="mt-2 text-xs text-muted">{t("admin.roles.needsApproved")}</p>}
      {role !== user.role && (
        <ActionBar
          className="mt-3"
          busy={busy}
          onAction={(_key, note) => onChange(role, note)}
          actions={[
            {
              key: "role",
              label: t("admin.roles.save"),
              icon: "shield",
              variant: "dark",
              confirm: { text: t("admin.roles.confirm", user.full_name, t(`admin.status.${role}`)), note: true },
            },
          ]}
        />
      )}
    </DrawerSection>
  );
}

/**
 * One account: information, uploaded ID card, registration decision and suspension (admins),
 * and its role (super admins). Staff accounts can't be suspended: demote them first.
 * Props: id, onClose, onChanged
 */
export default function UserDrawer({ id, onClose, onChanged }) {
  const { t, dateLocale } = useI18n();
  const { admin } = useAdmin();
  const { data: user, loading, error, retry } = useAsync((signal) => getUser(id, { signal }), [id]);
  const action = useAction(() => {
    retry();
    onChanged();
  });

  const self = user?.id === admin.id;
  const superAdmin = isSuperAdmin(admin);
  const locked = self || (user && user.role !== "student"); // own account and staff accounts: no registration / suspension actions
  const status = user?.registration_status;
  const lockedNote = self ? t("admin.users.selfNote") : superAdmin ? t("admin.users.staffNoteSuper") : t("admin.users.staffNote");

  return (
    <Drawer
      open
      onClose={onClose}
      title={user?.full_name ?? t("states.loading")}
      subtitle={
        user && (
          <span className="flex flex-wrap items-center gap-1.5">
            {user.role !== "student" && <StatusChip status={user.role} />}
            <StatusChip status={user.registration_status} />
            <StatusChip status={user.is_suspended ? "suspended" : "active"} />
          </span>
        )
      }
      footer={
        user &&
        (locked ? (
          <p className="flex items-start gap-2 text-sm text-muted">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
            {lockedNote}
          </p>
        ) : (
          <ActionBar
            busy={action.busy}
            onAction={(key, note) => action.run(() => userAction(id, key, note))}
            actions={[
              status !== "approved" && { key: "approve", label: t("admin.actions.approveRegistration"), icon: "check", variant: "dark" },
              status !== "rejected" && {
                key: "reject",
                label: t("admin.actions.rejectRegistration"),
                icon: "close",
                confirm: { text: t("admin.users.confirmReject"), note: true },
              },
              user.is_suspended
                ? { key: "unsuspend", label: t("admin.actions.unsuspend"), icon: "undo" }
                : {
                    key: "suspend",
                    label: t("admin.actions.suspend"),
                    icon: "ban",
                    danger: true,
                    confirm: { text: t("admin.users.confirmSuspend"), note: true },
                  },
            ]}
          />
        ))
      }
    >
      <ActionError error={action.error} onClose={action.clearError} />
      {loading && !user && <Spinner />}
      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}

      {user && (
        <>
          {superAdmin && !self && (
            <RoleSection user={user} busy={action.busy} onChange={(role, note) => action.run(() => setUserRole(id, role, note))} />
          )}

          <DrawerSection title={t("admin.users.idCard")}>
            {user.id_card_url ? (
              <a href={user.id_card_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-ink/10 bg-paper-2">
                <img src={user.id_card_url} alt={t("admin.users.idCardAlt", user.full_name)} className="max-h-72 w-full object-contain" />
              </a>
            ) : (
              <p className="rounded-xl border border-dashed border-ink/20 p-6 text-center text-sm text-muted">{t("admin.users.noIdCard")}</p>
            )}
            {status === "pending" && !locked && <p className="mt-3 text-sm text-ink-2">{t("admin.users.reviewHint")}</p>}
          </DrawerSection>

          <DrawerSection title={t("admin.users.information")}>
            <dl>
              <DetailRow label={t("admin.users.fields.email")}>
                <a href={`mailto:${user.email}`} className="hover:underline" dir="ltr">{user.email}</a>
              </DetailRow>
              <DetailRow label={t("admin.users.fields.phone")}><span dir="ltr">{user.phone || "—"}</span></DetailRow>
              <DetailRow label={t("admin.users.fields.studentNumber")}><span dir="ltr">{user.student_number || "—"}</span></DetailRow>
              <DetailRow label={t("admin.users.fields.faculty")}>{user.faculty}</DetailRow>
              <DetailRow label={t("admin.users.fields.joined")}>{formatDateTime(user.created_at, dateLocale)}</DetailRow>
              {user.is_suspended && <DetailRow label={t("admin.users.suspendedOn")}>{formatDateTime(user.suspended_at, dateLocale)}</DetailRow>}
            </dl>
          </DrawerSection>

          <DrawerSection title={t("admin.users.activity")}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ink/10 bg-surface p-4">
                <p className="text-2xl font-bold text-ink">{user.counts.items}</p>
                <p className="text-xs text-muted">{t("admin.users.publications")}</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-surface p-4">
                <p className="text-2xl font-bold text-ink">{user.counts.claims}</p>
                <p className="text-xs text-muted">{t("admin.users.claimsMade")}</p>
              </div>
            </div>
            {user.recent_items.length > 0 && (
              <ul className="mt-3 divide-y divide-ink/[0.07] rounded-xl border border-ink/10">
                {user.recent_items.map((item) => (
                  <li key={item.id}>
                    <Link to={`/admin/${item.type}?open=${item.id}`} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-ink/[0.03]">
                      <ItemStatusBadge type={item.type} />
                      <span className="min-w-0 flex-1 truncate font-medium text-ink" dir="auto">{item.title}</span>
                      <span className="text-xs text-muted">{formatDate(item.created_at, dateLocale)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
