/*//クイズ処理
// ランドマークごとのクイズ(17か所×3問)
const quizzes = quizData[spotName]; 

// URLからランドマーク名を取得
const params = new URLSearchParams(window.location.search);
const spotName = params.get("spot");

// localStorageから回答済み地点を取得
let answeredSpots =
    JSON.parse(localStorage.getItem("answeredSpots")) || [];

// quizData.jsonを読み込んでからクイズ開始
async function loadQuizData() {
    try {
        const response = await fetch("quizData.json");
        if (!response.ok) {
            throw new Error("quizData.jsonの読み込みに失敗しました");
        }
        const quizData = await response.json();
        startQuiz(quizData);
    } catch (error) {
        console.error(error);
        document.getElementById("quizBox").textContent =
            "クイズデータの読み込みに失敗しました。";
    }
}

// この地点をすでに回答しているか確認
function startQuiz(quizData){
  if (answeredSpots.includes(spotName)) {

    document.querySelector(".quiz-container").style.display = "none";
    const scoreScreen = document.getElementById("scoreScreen");
    scoreScreen.classList.remove("hidden");
    document.getElementById("scoreText").textContent =
        `${spotName}のクイズはすでに回答済みです。`;
  }
    document.getElementById("title").textContent =
        spotName + " クイズ";

    const quizzes = quizData[spotName];

    // クイズが存在しない場合
    if (!quizzes) {
        document.getElementById("quizBox").textContent =
            "この地点のクイズはありません。";
        return;
    }

    let index = 0;

    // このクイズでの正解数
    let score = 0;

    // 1問20点
    const POINT = 1200;

    // 問題表示

    function showQuiz() {
        document.getElementById("result").textContent = "";
        document.getElementById("explanation").textContent = "";
        document.getElementById("quizBox").textContent =
            quizzes[index].q;
    }

    // 最初の問題を表示
    showQuiz();

    // 回答

    window.answer = function(userAnswer) {

        const quiz = quizzes[index];
        const correct = quiz.a;

        // 正解判定
        if (userAnswer === correct) {
            document.getElementById("result").textContent =
                "正解！";
            score++;
        } else {
            document.getElementById("result").textContent =
                "不正解…";
        }


        document.getElementById("explanation").textContent =
            "解説： " + quiz.explanation;

        // 次の問題へ
        index++;

        if (index < quizzes.length) {
            setTimeout(showQuiz, 1000);
        } else {
            setTimeout(showScore, 1500);
        }
    };

    // スコア表示
    function showScore() {
        const quizScore = score * POINT;

        // 合計得点を取得
        let totalScore =
            Number(localStorage.getItem("totalScore")) || 0;

        // 今回の得点を加算
        totalScore += quizScore;

        // localStorageに保存
        localStorage.setItem(
            "totalScore",
            totalScore
        );

        // 回答済み地点として保存
        answeredSpots.push(spotName);

        localStorage.setItem(
            "answeredSpots",
            JSON.stringify(answeredSpots)
        );

        // クイズ画面を消す
        document.querySelector(".quiz-container").style.display =
            "none";

        // スコア画面表示
        document.getElementById("scoreScreen")
            .classList.remove("hidden");

        document.getElementById("scoreText").textContent =
            `${quizzes.length}問中 ${score}問正解（今回 ${quizScore}点）`;
    }
}

loadquizData();
*/

// クイズ処理

// URLからランドマーク名を取得
const params = new URLSearchParams(window.location.search);
const spotName = params.get("spot");


// localStorageから回答済み地点を取得
let answeredSpots =
    JSON.parse(localStorage.getItem("answeredSpots")) || [];


// ========================================
// quizData.jsonを読み込む
// ========================================

async function loadQuizData() {

    try {

        const response = await fetch("quizData.json");

        if (!response.ok) {
            throw new Error(
                "quizData.jsonの読み込みに失敗しました"
            );
        }

        const quizData = await response.json();

        startQuiz(quizData);

    } catch (error) {

        console.error(error);

        document.getElementById("quizBox").textContent =
            "クイズデータの読み込みに失敗しました。";
    }
}


// ========================================
// クイズ開始
// ========================================

function startQuiz(quizData) {

    // URLにspotが指定されていない
    if (!spotName) {

        document.getElementById("quizBox").textContent =
            "クイズの地点が指定されていません。";

        return;
    }


    // すでに回答済みか確認
    if (answeredSpots.includes(spotName)) {

        document.querySelector(".quiz-container").style.display =
            "none";

        const scoreScreen =
            document.getElementById("scoreScreen");

        scoreScreen.classList.remove("hidden");

        document.getElementById("scoreText").textContent =
            `${spotName}のクイズはすでに回答済みです。`;

        return;
    }


    // タイトル
    document.getElementById("title").textContent =
        spotName + " クイズ";


    // この地点のクイズを取得
    const quizzes = quizData[spotName];


    // クイズが存在しない場合
    if (!quizzes) {

        document.getElementById("quizBox").textContent =
            "この地点のクイズはありません。";

        return;
    }


    // ========================================
    // クイズ用変数
    // ========================================

    let index = 0;

    let score = 0;

    // 1問1200点
    const POINT = 1200;


    // ========================================
    // 問題表示
    // ========================================

    function showQuiz() {

        document.getElementById("result").textContent =
            "";

        document.getElementById("explanation").textContent =
            "";

        document.getElementById("quizBox").textContent =
            quizzes[index].q;
    }


    // 最初の問題
    showQuiz();


    // ========================================
    // 回答
    // ========================================

    window.answer = function(userAnswer) {

        // 二重クリック防止
        const buttons =
            document.querySelectorAll(".buttons button");

        buttons.forEach(button => {
            button.disabled = true;
        });


        const quiz = quizzes[index];

        const correct = quiz.a;


        // 正解判定
        if (userAnswer === correct) {

            document.getElementById("result").textContent =
                "正解！";

            score++;

        } else {

            document.getElementById("result").textContent =
                "不正解…";
        }


        // 解説表示
        document.getElementById("explanation").textContent =
            "解説： " + quiz.explanation;


        // 次の問題へ
        index++;


        if (index < quizzes.length) {

            setTimeout(() => {

                buttons.forEach(button => {
                    button.disabled = false;
                });

                showQuiz();

            }, 1000);

        } else {

            setTimeout(showScore, 1500);
        }
    };


    // ========================================
    // スコア表示
    // ========================================

    function showScore() {

        // 今回の得点
        const quizScore =
            score * POINT;


        // 現在の合計得点
        let totalScore =
            Number(
                localStorage.getItem("totalScore")
            ) || 0;


        // 今回の得点を加算
        totalScore += quizScore;


        // 保存
        localStorage.setItem(
            "totalScore",
            totalScore
        );


        // 回答済み地点に追加
        answeredSpots.push(spotName);


        localStorage.setItem(
            "answeredSpots",
            JSON.stringify(answeredSpots)
        );


        // クイズ画面を非表示
        document.querySelector(".quiz-container").style.display =
            "none";


        // スコア画面を表示
        document.getElementById("scoreScreen")
            .classList.remove("hidden");


        document.getElementById("scoreText").textContent =
            `${quizzes.length}問中 ${score}問正解（今回 ${quizScore}点）`;
    }
}


// ========================================
// JSON読み込み開始
// ========================================

loadQuizData();
