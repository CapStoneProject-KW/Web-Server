var express = require("express");
var router = express.Router();
const index = require("../controller");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

/* GET home page. */
// 첫번째 param = URL 정의 || 두번째 param = 해당 URL에서 할 작업 → req: URL에 담긴 요청정보 res: 작업 수행 후 보내줄 정보
router.get("/index", index.indexTest);

router.get("/index/video", index.youtubeVideo);

router.post("/index/upload", upload.single("video"), (req, res) => {
  try {

    const mp4Path = `uploads/${Date.now()}.mp4`;
    const tempPath =
      "C:/Users/user/Desktop/Programming/Last Dance/Web-Server/uploads/1674012392009.mp4";

    // const ffmpeg = spawn("ffmpeg", ["-i", webmPath, mp4Path]);

    // ffmpeg.stdout.on("data", (data) => {
    //   console.log(`stdout: ${data}`);
    // });
    // ffmpeg.stderr.on("data", (data) => {
    //   console.error(`stderr: ${data}`);
    // });
    // ffmpeg.on("close", (code) => {
    //   console.log(`child process exited with code ${code}`);
    // });

    axios
      .post(
        "http://127.0.0.1:5000/detection",
        {
          videoPath: tempPath,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log(res.data);
      });

    res.status(200).send("Video successfully uploaded");
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

module.exports = router;
