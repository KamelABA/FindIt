import { Link } from "react-router-dom";
import Drawer, { DetailRow, DrawerSection } from "../../components/admin/Drawer";
import ActionBar, { ActionError } from "../../components/admin/ActionBar";
import StatusChip from "../../components/admin/StatusChip";
import ItemStatusBadge from "../../components/ItemStatusBadge";
import { Spinner, ErrorState } from "../../components/StateMessages";
import { categoryLabel } from "../../constants/categories";
import { getClaim, claimAction } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n, errorText } from "../../lib/i18n";
import { useAction, formatDateTime } from "./hooks";

/**
 * One ownership request: the item, the claimant, their explanation and evidence, and the decision.
 * Props: id, onClose, onChanged
 */
export default function ClaimDrawer({ id, onClose, onChanged }) {
  const { t, dateLocale } = useI18n();
  const { data: claim, loading, error, retry } = useAsync((signal) => getClaim(id, { signal }), [id]);
  const action = useAction(() => {
    retry();
    onChanged();
  });

  const item = claim?.item;
  const person = claim?.claimant;
  const status = claim?.status;

  return (
    <Drawer
      open
      onClose={onClose}
      title={t("admin.claims.drawerTitle")}
      subtitle={claim && <StatusChip status={claim.status} />}
      footer={
        claim && (
          <ActionBar
            busy={action.busy}
            onAction={(key, note) => action.run(() => claimAction(id, key, note))}
            actions={[
              (status === "pending" || status === "rejected") && {
                key: "approve",
                label: t("admin.actions.approveClaim"),
                icon: "check",
                variant: "dark",
                confirm: { text: t("admin.claims.confirmApprove") },
              },
              (status === "pending" || status === "approved") && {
                key: "reject",
                label: t("admin.actions.reject"),
                icon: "close",
                confirm: { text: t("admin.claims.confirmReject"), note: true },
              },
              status === "approved" && {
                key: "complete",
                label: t("admin.actions.complete"),
                icon: "check",
                variant: "primary",
                confirm: { text: t("admin.claims.confirmComplete") },
              },
              status !== "pending" && { key: "reopen", label: t("admin.actions.reopen"), icon: "undo" },
            ]}
          />
        )
      }
    >
      <ActionError error={action.error} onClose={action.clearError} />
      {loading && !claim && <Spinner />}
      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}

      {claim && (
        <>
          <DrawerSection title={t("admin.claims.item")}>
            {item ? (
              <Link
                to={`/admin/${item.type}?open=${item.id}`}
                className="flex items-center gap-3 rounded-xl border border-ink/10 bg-surface p-3 hover:border-ink/25"
              >
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-2">
                  {item.images?.[0] && <img src={item.images[0]} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-semibold text-ink" dir="auto">{item.title}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <ItemStatusBadge type={item.type} />
                    {categoryLabel(t, item.category)}
                    <StatusChip status={item.lifecycle_status} />
                  </span>
                </span>
              </Link>
            ) : (
              <p className="text-sm text-muted">{t("admin.claims.deletedItem")}</p>
            )}
          </DrawerSection>

          <DrawerSection title={t("admin.claims.explanation")}>
            <p className="whitespace-pre-line rounded-xl bg-ink/[0.04] p-4 text-sm text-ink" dir="auto">
              {claim.message || t("admin.claims.noMessage")}
            </p>
          </DrawerSection>

          <DrawerSection title={t("admin.claims.evidence", claim.evidence_urls.length)}>
            {claim.evidence_urls.length === 0 ? (
              <p className="text-sm text-muted">{t("admin.claims.noEvidence")}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {claim.evidence_urls.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-ink/10 bg-paper-2">
                    <img src={src} alt={t("admin.claims.evidenceAlt")} className="aspect-square h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </DrawerSection>

          <DrawerSection title={t("admin.claims.claimant")}>
            {person ? (
              <dl>
                <DetailRow label={t("admin.users.fields.name")}>
                  <Link to={`/admin/users?open=${person.id}`} className="font-semibold text-brand-ink hover:underline" dir="auto">
                    {person.full_name}
                  </Link>
                </DetailRow>
                <DetailRow label={t("admin.users.fields.email")}>
                  <a href={`mailto:${person.email}`} className="hover:underline" dir="ltr">{person.email}</a>
                </DetailRow>
                <DetailRow label={t("admin.users.fields.phone")}><span dir="ltr">{person.phone || "—"}</span></DetailRow>
                <DetailRow label={t("admin.users.fields.studentNumber")}><span dir="ltr">{person.student_number || "—"}</span></DetailRow>
                <DetailRow label={t("admin.users.fields.faculty")}>{person.faculty}</DetailRow>
                <DetailRow label={t("admin.users.fields.account")}>
                  <span className="flex flex-wrap gap-1.5">
                    <StatusChip status={person.registration_status} />
                    {person.is_suspended && <StatusChip status="suspended" />}
                  </span>
                </DetailRow>
              </dl>
            ) : (
              <p className="text-sm text-muted">{t("admin.claims.deletedUser")}</p>
            )}
          </DrawerSection>

          <DrawerSection title={t("admin.claims.timeline")}>
            <dl>
              <DetailRow label={t("admin.claims.submitted")}>{formatDateTime(claim.created_at, dateLocale)}</DetailRow>
              <DetailRow label={t("admin.claims.updated")}>{formatDateTime(claim.updated_at, dateLocale)}</DetailRow>
              {claim.completed_at && <DetailRow label={t("admin.claims.completedOn")}>{formatDateTime(claim.completed_at, dateLocale)}</DetailRow>}
            </dl>
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
