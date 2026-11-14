import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";

import { errorMessage } from "../../api/errors";
import { useDeleteMenuMutation, useSaveMenuMutation } from "../../api/kitchenApi";
import type { Meal, Menu } from "../../api/types";
import { formatDate } from "../../lib/dates";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

interface Props {
  date: string;
  meal: Meal;
  /** The menu being edited; undefined when adding one. */
  menu: Menu | undefined;
  onClose: () => void;
}

/** Add or edit what is served for one meal on one day, with an optional photo. */
export default function MenuDialog({ date, meal, menu, onClose }: Props) {
  const [description, setDescription] = useState(menu?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveMenu, { isLoading: saving, error: saveError }] = useSaveMenuMutation();
  const [deleteMenu, { isLoading: deleting, error: deleteError }] = useDeleteMenuMutation();

  // Show the chosen file straight away, and release the temporary address after.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen && chosen.size > MAX_PHOTO_BYTES) {
      setFileError("The photo must be 3 MB or smaller.");
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(chosen);
    setRemovePhoto(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const body = new FormData();
    body.append("date", date);
    body.append("meal", String(meal.id));
    body.append("description", description.trim());
    if (file) body.append("photo", file);
    else if (removePhoto) body.append("remove_photo", "true");
    try {
      await saveMenu({ id: menu?.id, body }).unwrap();
      onClose();
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  async function handleDelete() {
    if (!menu) return;
    try {
      await deleteMenu(menu.id).unwrap();
      onClose();
    } catch {
      // The error is shown from the mutation state below.
    }
  }

  const shownPhoto = preview ?? (removePhoto ? null : (menu?.photo ?? null));
  const error = saveError ?? deleteError;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="menu-dialog-title">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="menu-dialog-title">
          {meal.name}, {formatDate(date, { weekday: "long", day: "numeric", month: "long" })}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{errorMessage(error)}</Alert>}
            <TextField
              label="What is being served"
              required
              autoFocus
              multiline
              minRows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            {shownPhoto ? (
              <Box
                component="img"
                src={shownPhoto}
                alt="Photo of this dish"
                sx={{ width: "100%", height: 160, objectFit: "cover", borderRadius: "12px", display: "block" }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No photo. Cards without one show a plain band.
              </Typography>
            )}
            {fileError && <Alert severity="error">{fileError}</Alert>}
            <Stack direction="row" spacing={1}>
              <Button component="label" variant="outlined" size="small">
                {shownPhoto ? "Replace photo" : "Add photo"}
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
              </Button>
              {shownPhoto && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    setFile(null);
                    setRemovePhoto(true);
                  }}
                >
                  Remove photo
                </Button>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              JPEG, PNG or WebP, up to 3 MB. Only use photos you have the right to publish.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
          {menu ? (
            <Button
              color="error"
              disabled={deleting}
              onClick={confirmDelete ? handleDelete : () => setConfirmDelete(true)}
            >
              {confirmDelete ? "Confirm delete" : "Delete"}
            </Button>
          ) : (
            <span />
          )}
          <Stack direction="row" spacing={1}>
            <Button color="inherit" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" variant="contained" disabled={saving || description.trim() === ""}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </Stack>
        </DialogActions>
      </form>
    </Dialog>
  );
}
