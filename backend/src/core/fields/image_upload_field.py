from flask_admin.form.upload import ImageUploadField, ImageUploadInput
from flask_admin._compat import urljoin

from pathlib import Path

import os


class AdminImageUploadInput(ImageUploadInput):
    empty_template = open(
        Path(os.getcwd()).joinpath('admin/templates/fields/image_upload/empty.html'),
        'r',
    ).read()

    data_template = open(
        Path(os.getcwd()).joinpath('admin/templates/fields/image_upload/data.html'),
        'r',
    ).read()

    def get_url(self, field):
        if field.thumbnail_size:
            filename = field.thumbnail_fn(field.data)
        else:
            filename = field.data

        if field.url_relative_path:
            filename = urljoin(field.url_relative_path, filename)

        return field.endpoint + filename


class AdminImageUploadField(ImageUploadField):
    widget = AdminImageUploadInput()
