// database.js에서 exports 한 pool 모듈을 가져옴. ("" 써야함-> 왜? '' 랑 차이점은 뭔데?)
const { pool } = require("../../config/database");
const { response, errResponse } = require("../../config/response");
const baseResponse = require("../../config/baseResponseDict");
const logger = require("loglevel");
const indexDao = require("../DAO");
const fs = require("fs");
const ytdl = require("ytdl-core");
const request = require("request");

let flag = false

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

  const url = req.body.url

  /** 난수생성과 유튜브링크 뒤 ID를 조합해서 섞이지 않는 PK 생성 **/
  const PK = url.split('=')[1] +  Math.random().toString().split('.')[1]

  /** 영상이 ytdl을 통해 저장될 폴더 위치 **/
  const dir = 'Users\\samsung_\\WebstormProjects\\LastDance-Web\\video'

  /** 영상 파일의 최종 위치, 해당 위치를 인자로 넘겨주어 접근하면 됨 **/
  const path = '/' + dir + '/' +'middlevideo'+PK+'.mp4'

  try {

    /** 입력받은 url을 통해 비동기로 다운로드

     *  1080p = 약 15초 이하
     *  360p(default) = 약 1초 이하
     *  lowestvideo = open 불가 (별도 코덱 필요)

     **/

/*
    /!** 기본 값(default) == 640 * 360  **!/
    ytdl(url)
        .pipe(fs.createWriteStream(path))
*/

    /** {quality Option = 'highestvideo' or 'lowestvideo' } **/

    ytdl(url, { quality: 'highestvideo' })
        .on('end', () => {
          console.log('end')
          flag = true;
          /** == 비동기로 비디오를 AI서버로 보낸다면, 여기 API는 res.send로 이미 return 한 상황 ==
           * 비디오를 다운완료하면 바로 AI서버로 보내도 상관없나? 후에 있을 영상처리과정에서는 return을 어디에 해주지?
           *
           1) /index/video API에서는 마지막에 res.render로 다음화면 처리
           * **/

          let options = {
            uri: "AI server 주소",
            method: 'POST',
            body: {
              filepath: path
            },
          }

          request(options,function(err,response,body){
            if(response.SUCCESS !== true){
              alert("조졌는데요?")
            }

            /**                       --- 내용 ---
                         Q) 영상 동시 Detection 혹은 먼저 오는 순서대로 ?
             동시 => 그냥 비동기로 영상 받고 끝 (어차피 영상 녹화되는 시간 안에 다운받아짐 아마)
             각각 => 응답 결과를 어디에 저장했다가 녹화까지 끝나고 한꺼번에 다른 API로 전송

             => detection 은 시간 얼마 안걸림(약 몇초)
             => AI 모델은 영상을 동시에 처리하지 않고 하나씩 순차적으로 처리한다.
             => 매칭된 정보는 나중에 모든 영상에 대해 KeyPoint, Tracking 처리를 다하고 사용되어도 상관없음


            **/

          })

        })
        .on('error', err => {
          console.log(err)
        }).pipe(fs.createWriteStream('highestVideo.mp4')
)

    return res.send(response(baseResponse.SUCCESS("완료되었습니다.")));


  } catch (err) {
    logger.warn("응답 실패" + err);
    return res.send(errResponse(baseResponse.FAIL));
  }
};

exports.sendVideo = async (req, res) => {
  const videoBuffer = fs.readFileSync("C:/Users/user/tiktok.mp4");

  // request 옵션 세팅
  const options = {
    url: "AI server 주소",
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    formData: {
      video: {
        value: videoBuffer,
        options: {
          filename: "tiktok.mp4",
          contentType: "video/mp4",
        },
      },
    },
  };

  request(options, (error, respons, body) => {
    if (error) {
      console.log(error);
    } else {
      console.log(respons.statusCode, body);
    }
  });
};
