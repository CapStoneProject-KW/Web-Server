const { spawn } = require("child_process");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userUUID = req.cookies.uuid;
        cb(null, `userLog/${userUUID}/`);
    },
    filename: (req, file, cb) => {
        const userUUID = req.cookies.uuid;
        cb(null, `${userUUID}userVideo.mp4`);
    },
});
const upload = multer({ storage });

module.exports = upload
