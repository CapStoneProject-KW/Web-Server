// database.js에서 exports 한 pool 모듈을 가져옴. ("" 써야함-> 왜? '' 랑 차이점은 뭔데?)
const { pool } = require("../../config/database");
const { response, errResponse } = require("../../config/response");
const baseResponse = require("../../config/baseResponseDict");
const logger = require("loglevel");
const indexDao = require("../DAO");
const fs = require("fs");
const ytdl = require("ytdl-core");
const request = require("request");
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");

exports.indexTest = async function (req, res, next) {
  try {
    // pool에서 getConnection 의 뜻과 사용 용도를 아직 모름 -> 알아봐야할 듯
    const connection = await pool.getConnection(async (conn) => conn);
    // 생성한 connection 객체를 DAO의 indexTestQuery 함수에 전달 → DAO에서 쿼리 수행 후 결과 값 반환 받음
    const result = await indexDao.indexTestQuery(connection);
    // connection을 썻으면 반드시 release를 해줘야한다. => 계속 connection 연결 시 중복 + Err
    connection.release();

    return res.send(
      response(baseResponse.SUCCESS("성공 메세지를 입력하세요"), result)
    );

    //Error 발생시 catch 문 실행
  } catch (err) {
    // TODO : 에러 로그 템플릿 - catch 문에서 발생한 err log 는 아래와 같이 진행(반드시 그렇게 해야할 필요는 없음)
    logger.warn("응답 실패" + err);
    return res.send(errResponse(baseResponse.FAIL));
  }
};

exports.youtubeVideo = async function (req, res) {
  try {
    /*        ytdl.chooseFormat('ffmpeg', { quality: '137' });
        ytdl('https://www.youtube.com/watch?v=8x43gsnkBH8')
            .pipe(fs.createWriteStream('video.mp4'));*/
    let url = "https://www.youtube.com/watch?v=8x43gsnkBH8"; // 안무영상 유튜브 링크

    const video = ytdl(url, {
      filter: function (format) {
        return format.quality === "highest";
      },
    });
    return res.send(response(baseResponse.SUCCESS("완료되었습니다.")));
  } catch (err) {
    logger.warn("응답 실패" + err);
    return res.send(errResponse(baseResponse.FAIL));
  }
};

// exports.sendVideo = async (req, res) => {
//   const videoBuffer = fs.readFileSync("C:/Users/user/Desktop/tiktok.mp4");

//   console.log(videoBuffer);

//   // request 옵션 세팅
//   // const options = {
//   //   url: "http://127.0.0.1:5000/estimate-poses",
//   //   method: "POST",
//   //   headers: {
//   //     "Content-Type": "multipart/form-data",
//   //   },
//   //   formData: {
//   //     video: {
//   //       value: videoBuffer,
//   //       options: {
//   //         filename: "tiktok.mp4",
//   //         contentType: "video/mp4",
//   //       },
//   //     },
//   //   },
//   // };

//   // request(options, (error, respons, body) => {
//   //   if (error) {
//   //     console.log(error);
//   //   } else {
//   //     console.log(respons.statusCode, body);
//   //   }
//   // });

//   request.post(
//     {
//       url: "http://127.0.0.1:5000/estimate-poses",
//       body: videoBuffer,
//       headers: {
//         "Content-Type": "video/mp4",
//       },
//     },
//     (error, response_2, body) => {
//       if (error) {
//         console.error(error);
//       } else {
//         console.log(body);
//         return res.status(200).send(body);
//       }
//     }
//   );
// };

// exports.sendVideo2 = async (req, res) => {
//   // 1. 사용자로부터 파일을 업로드 받는다.
//   // 2. 서버 컴퓨터 어딘가 저장소에 해당 비디오 파일을 저장 -> 경로
//   // 3. Flask 서버로 request 요청(parameter: '경로')
//   // 3-1. response -> body: {1: 80, 2: 92, ...}
//   //4. body값 그대로 res.status(200).send(body)

//   console.log(req);
//   // 1. 사용자로부터 파일을 업로드 받는다.
//   const video = req.file;
//   const targetPath = path.join(__dirname, "save/video");
//   console.log(video);
//   video.mv(targetPath, (err) => {
//     if (err) {
//       return res.status(500).send(err);
//     }

//     res.json({ file: `${video.name}` });
//   });
// };

// exports.upload = (req, res) => {
//   try {
//     const webmPath = req.file?.path;
//     const mp4Path = `uploads/${Date.now()}.mp4`;

//     const ffmpeg = spawn("ffmpeg", ["-i", webmPath, mp4Path]);

//     ffmpeg.stdout.on("data", (data) => {
//       console.log(`stdout: ${data}`);
//     });
//     ffmpeg.stderr.on("data", (data) => {
//       console.error(`stderr: ${data}`);
//     });
//     ffmpeg.on("close", (code) => {
//       console.log(`child process exited with code ${code}`);
//     });

//     res.status(200).send("Video successfully uploaded");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send(err);
//   }
// };

// exports.upload2 = (req, res) => {
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}_${file.originalname}`);
//     },
//   });

//   const upload = multer({ storage }).single("video");

//   try {
//     upload(req, res, (err) => {
//       if (err) {
//         return res.json({ success: false, err });
//       }
//       return res.json({
//         success: true,
//         url: res.req.file.path,
//         fileName: res.req.file.filename,
//       });
//     });
//     const webmPath = req.file?.path;
//     const mp4Path = `uploads/${Date.now()}.mp4`;

//     const ffmpeg = spawn("ffmpeg", ["-i", webmPath, mp4Path]);

//     ffmpeg.stdout.on("data", (data) => {
//       console.log(`stdout: ${data}`);
//     });
//     ffmpeg.stderr.on("data", (data) => {
//       console.error(`stderr: ${data}`);
//     });
//     ffmpeg.on("close", (code) => {
//       console.log(`child process exited with code ${code}`);
//     });

//     res.status(200).send("Video successfully uploaded");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send(err);
//   }
// };
