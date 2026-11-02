-- Log audit tidak boleh diubah atau dihapus dari aplikasi (maupun lewat SQL biasa).
-- Mengubahnya mengharuskan DROP TRIGGER secara eksplisit.
CREATE TRIGGER IF NOT EXISTS `audit_log_no_update` BEFORE UPDATE ON `audit_log`
BEGIN
  SELECT RAISE(ABORT, 'audit_log bersifat append-only');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `audit_log_no_delete` BEFORE DELETE ON `audit_log`
BEGIN
  SELECT RAISE(ABORT, 'audit_log bersifat append-only');
END;
