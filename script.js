//現在地アイコン詳細
const userIcon = L.icon({
  iconUrl: "current-pin.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

//マップ初期位置
const map = L.map("map").setView([37.9555, 139.3400], 15);

//マップタイル
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap contributors"
  }
).addTo(map);

//jsonからスポットデータの読み込み
async function loadSpotData() {
  try {
    const [spotsResponse, spots2Response] = await Promise.all([
      fetch("spots.json"),
      fetch("spots2.json")
    ]);

    if (!spotsResponse.ok)
      throw new Error("spots.jsonの読み込みに失敗しました");

    if (!spots2Response.ok)
      throw new Error("spots2.jsonの読み込みに失敗しました");

    const baseSpots = await spotsResponse.json();
    const baseRareSpots = await spots2Response.json();

    const addedSpots = JSON.parse(
      localStorage.getItem("addedSpots") || "[]"
    );

    const addedRareSpots = JSON.parse(
      localStorage.getItem("addedRareSpots") || "[]"
    );

    initializeMap(
      [...baseSpots, ...addedSpots],
      [...baseRareSpots, ...addedRareSpots]
    );

  } catch (error) {
    console.error(error);
    document.getElementById("result").textContent =
      "スポットデータの読み込みに失敗しました。";
  }
}

function initializeMap(spots, spots2) {
//回答済み
  let answeredSpots = JSON.parse(
    localStorage.getItem("answeredSpots") || "[]"
  );
//到達済み
  let arrivalSpots = JSON.parse(
    localStorage.getItem("arrivalSpots") || "[]"
  );

 //通常スポット表示
spots.forEach(spot => {

  const popupContent = `
    <div style="text-align:center;">
      <h3>${spot.name}</h3>
      ${
        spot.image
          ? `${spot.image}`
          :""
      }
    </div>
  `;

  //各スポットにマーカー設置
  L.marker([spot.lat, spot.lng])
    .addTo(map)
    .bindPopup(popupContent);

  //回答可能範囲の円
  L.circle(
    [spot.lat, spot.lng],
    {
      radius: spot.radius,
      color: "blue",
      fillOpacity: 0.2
    }
  ).addTo(map);
});

  //激レア処理
  function updateRareSpots() {
    //合計得点
    const totalScore =
      Number(localStorage.getItem("totalScore")) || 0;

    const currentAnsweredSpots = JSON.parse(
      localStorage.getItem("answeredSpots") || "[]"
    );

    //激レアスポット表示
    spots2.forEach(spot => {
      //激レア開放条件
      if (totalScore < spot.unlockPoint) return;
      if (spot.marker) return;

      const answered =
        currentAnsweredSpots.includes(spot.name);

      //激レアピン
      const marker = L.marker(
        [spot.lat, spot.lng],
        {
          icon: L.icon({
            iconUrl: "rare-pin.png",
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
          })
        }
      ).addTo(map);

      //回答可能範囲の円
      L.circle(
        [spot.lat, spot.lng],
        {
          radius: spot.radius,
          color: "gold",
          fillColor: "gold",
          fillOpacity: 0.2
        }
      ).addTo(map);

      const popupContent = answered
        ? `
          <div style="text-align:center;">
            <h3>★ ${spot.name}</h3>
            <p>回答済み</p>
          </div>
        `
        : `
          <div style="text-align:center;">
            <h3>★ ${spot.name}</h3>
            ${
              spot.image
                ? `${spot.image}`
                : ""
            }
            <p>激レアスポット解放！</p>
          </div>
        `;

      marker.bindPopup(popupContent);
      spot.marker = marker;
    });
  }

  //距離計算(ハーサイン公式)
  function getDistance(lat1, lng1, lat2, lng2) {

    const R = 6371000;

    const toRad = x => x * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

    return 2 * R *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );
  }

  //クイズ画面移動
  function goToQuiz(spotName, arrivalPoint = 0) {
    //初回到達時
    if (!arrivalSpots.includes(spotName)) {

      let totalScore =
        Number(localStorage.getItem("totalScore")) || 0;

      totalScore += arrivalPoint;

      localStorage.setItem(
        "totalScore",
        String(totalScore)
      );

      arrivalSpots.push(spotName);

      localStorage.setItem(
        "arrivalSpots",
        JSON.stringify(arrivalSpots)
      );
    }

    window.location.href =
      `quiz.html?spot=${encodeURIComponent(spotName)}`;
  }

  if (!navigator.geolocation) {

    document.getElementById("result").textContent =
      "この端末では位置情報を利用できません。";

  } else {

    navigator.geolocation.watchPosition(

      position => {

        const userLat =
          position.coords.latitude;

        const userLng =
          position.coords.longitude;

        document.getElementById("coords").innerHTML =
          `緯度: ${userLat.toFixed(6)}<br>経度: ${userLng.toFixed(6)}`;

        if (window.userMarker)
          map.removeLayer(window.userMarker);

        //現在地マーカー
        window.userMarker = L.marker(
          [userLat, userLng],
          { icon: userIcon }
        )
          .addTo(map)
          .bindPopup("現在地");

        let found = false;

        const currentAnswered = JSON.parse(
          localStorage.getItem("answeredSpots") || "[]"
        );

        const totalScore =
          Number(localStorage.getItem("totalScore")) || 0;

        for (const spot of [...spots, ...spots2]) {

          if (
            spots2.includes(spot) &&
            totalScore < spot.unlockPoint
          ) {
            continue;
          }

          if (
            currentAnswered.includes(spot.name)
          ) {
            continue;
          }

          //円に入ったかの計算
          const distance = getDistance(
            userLat,
            userLng,
            spot.lat,
            spot.lng
          );

          if (distance <= spot.radius) {

            found = true;

            //激レア到達時の青文字
            document.getElementById("result").innerHTML =
              `<b>${spots2.includes(spot) ? "★ " : ""}${spot.name}に到達！</b><br>
               <a href="quiz.html?spot=${encodeURIComponent(spot.name)}">
               クイズへ
               </a>`;

            break;
          }
        }

        if (!found) {
          document.getElementById("result").textContent =
            "新発田市内を移動してください";
        }
      },

      error => {

        console.error(
          "位置情報エラー:",
          error
        );

        document.getElementById("result").textContent =
          "位置情報が取得できません。";
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }

  //得点の更新
  function updateTotalScore() {

    const totalScore =
      Number(localStorage.getItem("totalScore")) || 0;

    const scoreElement =
      document.getElementById("totalScore");

    if (scoreElement) {
      scoreElement.textContent =
        `現在の得点：${totalScore}点`;
    }

    updateRareSpots();
  }

  //リセットボタン
  window.resetGame = function () {
    if (
      !confirm(
        "得点と回答履歴をすべてリセットしますか？"
      )
    ) {
      return;
    }

    //得点、回答履歴、到達履歴をリセットする
    localStorage.setItem(
      "totalScore",
      "0"
    );
    localStorage.setItem(
      "answeredSpots",
      JSON.stringify([])
    );
    localStorage.setItem(
      "arrivalSpots",
      JSON.stringify([])
    );

    alert(
      "得点と回答履歴をリセットしました。"
    );

    location.reload();
  };
  //ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
  //スポット追加部分
  //ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー
  const openAddForm =
    document.getElementById("openAddForm");

  const addForm =
    document.getElementById("addSpotForm");

  const spotForm =
    document.getElementById("spotForm");

  const spotType =
    document.getElementById("spotType");

  const rareSettings =
    document.getElementById("rareSettings");

  const addMessage =
    document.getElementById("addSpotMessage");

  if (
    openAddForm &&
    addForm &&
    spotForm &&
    spotType &&
    rareSettings &&
    addMessage
  ) {

    openAddForm.addEventListener(
      "click",
      () => {

        addForm.hidden = false;

        addForm.scrollIntoView({
          behavior: "smooth"
        });
      }
    );

    const cancelButton =
      document.getElementById(
        "cancelAddForm"
      );

    if (cancelButton)
      cancelButton.addEventListener(
        "click",
        () => {
          addForm.hidden = true;
          addMessage.textContent = "";
        }
      );

    spotType.addEventListener(
      "change",
      () => {
        rareSettings.hidden =
          spotType.value !== "rare";
      }
    );

    spotForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        try {
          //追加スポット詳細入力部分
          const name =
            document.getElementById(
              "spotName"
            ).value.trim();
          const lat = Number(
            document.getElementById(
              "spotLat"
            ).value
          );
          const lng = Number(
            document.getElementById(
              "spotLng"
            ).value
          );
          const radius = Number(
            document.getElementById(
              "spotRadius"
            ).value
          );
          const image =
            document.getElementById(
              "spotImage"
            ).value.trim();
          //不備
          if (!name)
            throw new Error(
              "スポット名を入力してください。"
            );
          if (
            !Number.isFinite(lat) ||
            lat < -90 ||
            lat > 90 ||
            !Number.isFinite(lng) ||
            lng < -180 ||
            lng > 180
          ) {
            throw new Error(
              "緯度・経度が正しくありません。"
            );
          }
          if (
            !Number.isFinite(radius) ||
            radius < 1 ||
            radius > 10000
          ) {
            throw new Error(
              "範囲は1～10000mで指定してください。"
            );
          }
          if (
            [...spots, ...spots2]
              .some(s => s.name === name)
          ) {
            throw new Error(
              "同じ名前のスポットがすでにあります。"
            );
          }

          const quizzes = [1, 2, 3].map(i => {

            const q =
              document.getElementById(
                `q${i}`
              ).value.trim();
            const explanation =
              document.getElementById(
                `e${i}`
              ).value.trim();

            if (!q || !explanation) {
              throw new Error(
                `クイズ${i}の問題文と解説を入力してください。`
              );
            }

            return {
              q,
              a:
                document.getElementById(
                  `a${i}`
                ).value === "true",
              explanation
            };
          });

          const newSpot = {
            name,
            lat,
            lng,
            radius,
            ...(image ? { image } : {})
          };

          const isRare =
            spotType.value === "rare";

          if (isRare) {

            const unlockPoint = Number(
              document.getElementById(
                "unlockPoint"
              ).value
            );

            if (
              !Number.isFinite(
                unlockPoint
              ) ||
              unlockPoint < 0
            ) {
              throw new Error(
                "解放に必要な得点は0以上で入力してください。"
              );
            }

            newSpot.unlockPoint =
              unlockPoint;
          }

          const addedSpots = JSON.parse(
            localStorage.getItem(
              "addedSpots"
            ) || "[]"
          );

          const addedRareSpots = JSON.parse(
            localStorage.getItem(
              "addedRareSpots"
            ) || "[]"
          );

          const addedQuizzes = JSON.parse(
            localStorage.getItem(
              "addedQuizData"
            ) || "{}"
          );

          if (isRare) {
            addedRareSpots.push(
              newSpot
            );
          } else {
            addedSpots.push(
              newSpot
            );
          }

          addedQuizzes[name] = quizzes;

          localStorage.setItem(
            "addedSpots",
            JSON.stringify(
              addedSpots
            )
          );

          localStorage.setItem(
            "addedRareSpots",
            JSON.stringify(
              addedRareSpots
            )
          );

          localStorage.setItem(
            "addedQuizData",
            JSON.stringify(
              addedQuizzes
            )
          );

          addMessage.textContent =
            "登録しました。地図を更新します。";

          location.reload();

        } catch (error) {

          console.error(
            "スポット登録エラー:",
            error
          );

          addMessage.textContent =
            error.message ||
            "登録に失敗しました。";
        }
      }
    );
  }

  updateTotalScore();
}

loadSpotData();

//追加スポットのリセットボタン
window.deleteAddedSpots = function () {
  if (!confirm("追加したスポット・レアスポット・クイズを削除しますか？")) {
    return;
  }
  localStorage.removeItem("addedSpots");
  localStorage.removeItem("addedRareSpots");
  localStorage.removeItem("addedQuizData");
  alert("追加したスポットデータを削除しました。");
  location.reload();
};
