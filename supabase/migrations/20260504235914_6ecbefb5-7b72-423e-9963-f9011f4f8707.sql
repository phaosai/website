
-- Revoke public/anon execute, grant to authenticated (read) and service_role (mutations)
REVOKE ALL ON FUNCTION public.get_user_active_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_active_plan(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_or_create_usage_period(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_usage_period(uuid, timestamptz) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_quantum_audit_entitlement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_quantum_audit_entitlement(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_report_entitlement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_report_entitlement(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public._ensure_credit_balance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._ensure_credit_balance(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.consume_quantum_audit_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_quantum_audit_credit(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.refund_quantum_audit_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_quantum_audit_credit(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.consume_report_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_report_credit(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.grant_add_on_credits(uuid, text, integer, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_add_on_credits(uuid, text, integer, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.create_quantum_audit_record(uuid, text, text, jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_quantum_audit_record(uuid, text, text, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.update_quantum_audit_status(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_quantum_audit_status(uuid, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.get_account_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_account_summary(uuid) TO authenticated, service_role;
