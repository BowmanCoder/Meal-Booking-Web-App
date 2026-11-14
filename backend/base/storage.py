import io
import secrets
from pathlib import PurePosixPath

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

FOLDER = "bookmymeal"


@deconstructible
class CloudinaryMediaStorage(Storage):
    """Keep uploaded dish photos on Cloudinary.

    The free web host wipes its disk on every deploy, so photos saved there
    would disappear. Credentials come from the CLOUDINARY_URL environment
    variable, which the cloudinary library reads by itself.
    """

    def _public_id(self, name):
        path = PurePosixPath(name.replace("\\", "/"))
        return f"{FOLDER}/{path.with_suffix('')}"

    def get_available_name(self, name, max_length=None):
        # A random suffix instead of asking Cloudinary whether the name is taken.
        path = PurePosixPath(name.replace("\\", "/"))
        return str(path.with_name(f"{path.stem}-{secrets.token_hex(4)}{path.suffix}"))

    def _save(self, name, content):
        result = cloudinary.uploader.upload(
            io.BytesIO(content.read()),
            public_id=self._public_id(name),
            resource_type="image",
            overwrite=True,
        )
        # Cloudinary decides the real format, so store the name with that suffix.
        return str(PurePosixPath(name.replace("\\", "/")).with_suffix(f".{result['format']}"))

    def url(self, name):
        url, _options = cloudinary.utils.cloudinary_url(
            self._public_id(name),
            format=PurePosixPath(name).suffix.lstrip(".") or None,
            resource_type="image",
            secure=True,
            # Let Cloudinary send a smaller, modern format when the browser takes it.
            fetch_format="auto",
            quality="auto",
        )
        return url

    def delete(self, name):
        cloudinary.uploader.destroy(self._public_id(name), resource_type="image", invalidate=True)

    def exists(self, name):
        return False

    def _open(self, name, mode="rb"):
        raise NotImplementedError("Photos are served straight from Cloudinary.")
