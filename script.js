const userIcon = L.icon({
    iconUrl: "current-pin.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const map = L.map("map").setView(
    [37.9555, 139.3400],
    15
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);

async function loadSpotData() {
    try {
        const [spotsResponse, spots2Response] =
            await Promise.all([
                fetch("spots.json"),
                fetch("spots2.json")
            ]);

        if (!spotsResponse.ok) {
            throw new Error(
                "spots.jsonの読み込みに失敗しました"
            );
        }

        if (!spots2Response.ok) {
            throw new Error(
                "spots2.jsonの読み込みに失敗しました"
            );
        }

        // JSONをJavaScriptの配列に変換
        const spots =
            await spotsResponse.json();
        const spots2 =
            await spots2Response.json();
        // 地図処理開始
        initializeMap(
            spots,
            spots2
        );

    } catch (error) {
        console.error(error);
        document.getElementById("result").textContent =
            "スポットデータの読み込みに失敗";
    }
}

function initializeMap(
    spots,
    spots2
) {

    let answeredSpots =
        JSON.parse(
            localStorage.getItem("answeredSpots")
        ) || [];

    let arrivalSpots =
        JSON.parse(
            localStorage.getItem("arrivalSpots")
        ) || [];

    spots.forEach(spot => {

        // ポップアップ
        const popupContent = `
            <div style="text-align:center;">
                <h3>${spot.name}</h3>
                ${
                    spot.image
                    ? `<img src="${spot.image}" width="200">`
                    : ""
                }
                <br>
            </div>
        `;

        // マーカー
        L.marker([
            spot.lat,
            spot.lng
        ])
        .addTo(map)
        .bindPopup(popupContent);

        // クイズ可能範囲
        L.circle(
            [
                spot.lat,
                spot.lng
            ],
            {
                radius: spot.radius,
                color: "blue",
                fillOpacity: 0.2
            }
        ).addTo(map);
    });

    // 激レアスポット更新
    function updateRareSpots() 
        const totalScore =
            Number(
                localStorage.getItem("totalScore")
            ) || 0;

        const currentAnsweredSpots =
            JSON.parse(
                localStorage.getItem("answeredSpots")
            ) || [];

        spots2.forEach(spot => {

            // 必要得点未達
            if (
                totalScore <
                spot.unlockPoint
            ) {
                return;
            }

            // すでにマーカー作成済み
            if (spot.marker) {
                return;
            }

            // 回答済みか
            const answered =
                currentAnsweredSpots.includes(
                    spot.name
                );

            // 激レアマーカー
            const marker =
                L.marker(
                    [
                        spot.lat,
                        spot.lng
                    ],
                    {
                        icon: L.icon({
                            iconUrl: "rare-pin.png",
                            iconSize: [40, 40],
                            iconAnchor: [20, 40],
                            popupAnchor: [0, -40]
                        })
                    }
                ).addTo(map);

            // 激レアの回答可能範囲
            L.circle(
                [
                    spot.lat,
                    spot.lng
                ],
                {
                    radius: spot.radius,
                    color: "gold",
                    fillColor: "gold",
                    fillOpacity: 0.2
                }
            ).addTo(map);
            let popupContent;
            if (answered) {
                popupContent = `
                    <div style="text-align:center;">
                        <h3>★ ${spot.name}</h3>
                        <p>回答済み</p>
                    </div>
                `;

            } else {

                popupContent = `
                    <div style="text-align:center;">
                        <h3>★ ${spot.name}</h3>
                        ${
                            spot.image
                            ? `<img src="${spot.image}" width="200"><br>`
                            : ""
                        }
                        <p>激レアスポット解放！</p>
                    </div>
                `;
            }

            marker.bindPopup(
                popupContent
            );

            // マーカー保存
            spot.marker = marker;
        });
    }

    // 初回
    updateRareSpots();

    // 距離計算
    function getDistance(
        lat1,
        lng1,
        lat2,
        lng2
    ) {
        const R = 6371000;
        const toRad =
            x => x * Math.PI / 180;
        const dLat =
            toRad(
                lat2 - lat1
            );
        const dLng =
            toRad(
                lng2 - lng1
            );
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(
                toRad(lat1)
            ) *
            Math.cos(
                toRad(lat2)
            ) *
            Math.sin(dLng / 2) ** 2;

        return (
            2 *
            R *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            )
        );
    }

    // クイズへ移動
    function goToQuiz(
        spotName,
        arrivalPoint
    ) {
        // すでに到達ポイントを取得しているか
        if (
            !arrivalSpots.includes(
                spotName
            )
        ) {

            let totalScore =
                Number(
                    localStorage.getItem("totalScore")
                ) || 0;

            // 到達ポイントを加算
            totalScore += arrivalPoint;

            localStorage.setItem(
                "totalScore",
                totalScore
            );

            // 到達済みに追加
            arrivalSpots.push(
                spotName
            );

            localStorage.setItem(
                "arrivalSpots",
                JSON.stringify(
                    arrivalSpots
                )
            );
        }

        // クイズページへ
        window.location.href =
            `quiz.html?spot=${encodeURIComponent(spotName)}`;
    }

    // 現在地取得
    if (
        !navigator.geolocation
    ) {
        document.getElementById("result")
            .textContent =
            "この端末では位置情報を利用できません。";
        return;
    }

    navigator.geolocation.watchPosition(
        position => {

            const userLat =
                position.coords.latitude;

            const userLng =
                position.coords.longitude;

            // 緯度・経度表示
            document.getElementById(
                "coords"
            ).innerHTML = `
                緯度: ${userLat.toFixed(6)}<br>
                経度: ${userLng.toFixed(6)}
            `;

            // 現在地マーカー
            if (
                window.userMarker
            ) {

                map.removeLayer(
                    window.userMarker
                );
            }

            window.userMarker =
                L.marker(
                    [
                        userLat,
                        userLng
                    ],
                    {
                        icon: userIcon
                    }
                )
                .addTo(map)
                .bindPopup("現在地");

            let found = false;

            // 通常スポット判定
            spots.forEach(spot => {
                const distance =
                    getDistance(
                        userLat,
                        userLng,
                        spot.lat,
                        spot.lng
                    );

                // 到達した場合
                if (
                    !answeredSpots.includes(
                        spot.name
                    ) &&
                    distance <= spot.radius
                ) {

                    found = true;

                    // 通常スポットは到達ポイント0点
                    document.getElementById(
                        "result"
                    ).innerHTML = `
                        <b>
                            ${spot.name}に到達！
                        </b>
                        <br>
                        <a href="quiz.html?spot=${encodeURIComponent(spot.name)}">
                            クイズへ
                        </a>
                    `;
                }

            });

            // 激レアスポット判定
            spots2.forEach(spot => {

                const totalScore =
                    Number(
                        localStorage.getItem(
                            "totalScore"
                        )
                    ) || 0;

                // 必要得点未達
                if (
                    totalScore <
                    spot.unlockPoint
                ) {
                    return;
                }

                const distance =
                    getDistance(
                        userLat,
                        userLng,
                        spot.lat,
                        spot.lng
                    );

                if (
                    !answeredSpots.includes(
                        spot.name
                    ) &&
                    distance <= spot.radius
                ) {
                    found = true;

                    document.getElementById(
                        "result"
                    ).innerHTML = `
                        <b>
                            ★ ${spot.name}に到達！
                        </b>
                        <br>
                        <a href="quiz.html?spot=${encodeURIComponent(spot.name)}">
                            クイズへ
                        </a>
                    `;
                }

            });

            // スポットにいない場合
            if (!found) {
                document.getElementById(
                    "result"
                ).innerHTML =
                    "新発田市内を移動してください";
            }
        },

        // 位置情報エラー
        error => {
            console.error(
                "位置情報エラー:",
                error
            );

            document.getElementById(
                "result"
            ).textContent =
                "位置情報が取得できません。";
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    );

    // 合計得点表示
    function updateTotalScore() {

        const totalScore =
            Number(
                localStorage.getItem(
                    "totalScore"
                )
            ) || 0;


        const scoreElement =
            document.getElementById(
                "totalScore"
            );

        if (scoreElement) {
            scoreElement.textContent =
                `現在の得点：${totalScore}点`;
        }

        // 激レアスポット更新
        updateRareSpots();
    }

    // リセット
    window.resetGame =
        function() {

            const result =
                confirm(
                    "得点と回答履歴をすべてリセットしますか？"
                );

            if (!result) {
                return;
            }

            // 得点リセット
            localStorage.setItem(
                "totalScore",
                "0"
            );

            // クイズ回答履歴リセット
            localStorage.setItem(
                "answeredSpots",
                JSON.stringify([])
            );

            // 到達ポイント履歴リセット
            localStorage.setItem(
                "arrivalSpots",
                JSON.stringify([])
            );

            alert(
                "得点と回答履歴をリセットしました。"
            );

            location.reload();
        };

    // 初回得点表示
    updateTotalScore();
}

// クォート対策
function escapeQuote(text) {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

// JSON読み込み開始
loadSpotData();
