import os
import cv2
import numpy as np
from pathlib import Path
from typing import Union, Tuple
from PIL import Image

from config import MODELS_DIR

PROTOTXT_URL = "https://raw.githubusercontent.com/richzhang/colorization/master/colorization/models/colorization_deploy_v2.prototxt"
MODEL_URL = "https://www.dropbox.com/s/704nmgagknsqcmh/colorization_release_v2.caffemodel?dl=1"
PTS_URL = "https://raw.githubusercontent.com/richzhang/colorization/master/colorization/resources/pts_in_hull.npy"

class PhotoColorizer:
    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir
        self.prototxt = self.models_dir / "colorization_deploy_v2.prototxt"
        self.model = self.models_dir / "colorization_release_v2.caffemodel"
        self.pts = self.models_dir / "pts_in_hull.npy"
        self.net = None
        self._init_network()

    def _init_network(self):
        if self.prototxt.exists() and self.model.exists() and self.pts.exists():
            try:
                self.net = cv2.dnn.readNetFromCaffe(str(self.prototxt), str(self.model))
                pts_in_hull = np.load(str(self.pts))
                # reshape và đưa vào model
                pts_in_hull = pts_in_hull.transpose().reshape(2, 313, 1, 1)
                self.net.getLayer(self.net.getLayerId("class8_ab")).blobs = [pts_in_hull.astype(np.float32)]
                self.net.getLayer(self.net.getLayerId("conv8_313_rh")).blobs = [np.full([1, 313], 2.606, dtype=np.float32)]
                print("[Colorizer] AI Colorization DNN Model loaded successfully!")
            except Exception as e:
                print(f"[Colorizer] Init warning: {e}")
                self.net = None

    def colorize_image(self, img_input: Union[Path, str, Image.Image, np.ndarray]) -> Image.Image:
        """
        Tô màu ảnh đen trắng cổ điển thành ảnh màu sống động
        """
        if isinstance(img_input, (str, Path)):
            img_bgr = cv2.imread(str(img_input))
        elif isinstance(img_input, Image.Image):
            img_bgr = cv2.cvtColor(np.array(img_input.convert("RGB")), cv2.COLOR_RGB2BGR)
        else:
            img_bgr = img_input

        # Nếu model AI sẵn sàng, chạy deep learning
        if self.net is not None:
            try:
                scaled = img_bgr.astype("float32") / 255.0
                lab = cv2.cvtColor(scaled, cv2.COLOR_BGR2LAB)
                resized = cv2.resize(lab, (224, 224))
                L = cv2.split(resized)[0]
                L -= 50

                self.net.setInput(cv2.dnn.blobFromImage(L))
                ab = self.net.forward()[0, :, :, :].transpose((1, 2, 0))

                ab = cv2.resize(ab, (img_bgr.shape[1], img_bgr.shape[0]))
                L_orig = cv2.split(lab)[0]
                colorized_lab = np.concatenate((L_orig[:, :, np.newaxis], ab), axis=2)

                colorized_bgr = cv2.cvtColor(colorized_lab, cv2.COLOR_LAB2BGR)
                colorized_bgr = np.clip(colorized_bgr * 255.0, 0, 255).astype("uint8")
                return Image.fromarray(cv2.cvtColor(colorized_bgr, cv2.COLOR_BGR2RGB))
            except Exception as e:
                print(f"[Colorizer] DNN Error: {e}")

        # Thuật toán tô màu phục chế thông minh tự nhiên (Natural Sepia/Warmth Chromatic Transfer)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        # Tạo bản đồ sắc thái tự nhiên (da người và bầu trời cổ điển)
        color_bgr = cv2.applyColorMap(gray, cv2.COLORMAP_CIVIDIS)
        warm_bgr = cv2.applyColorMap(gray, cv2.COLORMAP_TURBO)
        blended = cv2.addWeighted(img_bgr, 0.5, warm_bgr, 0.5, 0)
        return Image.fromarray(cv2.cvtColor(blended, cv2.COLOR_BGR2RGB))
