import { Link } from "react-router-dom";
import Drawer, { DetailRow, DrawerSection } from "../../components/admin/Drawer";
import ActionBar, { ActionError } from "../../components/admin/ActionBar";
import StatusChip from "../../components/admin/StatusChip";
import ItemStatusBadge from "../../components/ItemStatusBadge";
import Icon from "../../components/Icon";
import { Spinner, ErrorState } from "../../components/StateMessages";
import { getUser, userAction } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n, errorText } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAdmin } from "./AdminLayout";
import { useAction, formatDateTime } from "./hooks";

/**
 * One student: information, uploaded ID card, registration decision and suspension.
 * Admin rights are not changed here (they are managed in the database).
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
  const locked = self || user?.is_admin; // own account and admins: managed in the database
  const status = user?.registration_status;

  return (
    <Drawer
      open
      onClose={onClose}
      title={user?.full_name ?? t("states.loading")}
      subtitle={
        user && (
          <span className="flex flex-wrap items-center gap-1.5">
            {user.is_admin && <StatusChip status="admin" />}
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
            {self ? t("admin.users.selfNote") : t("admin.users.adminNote")}
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
