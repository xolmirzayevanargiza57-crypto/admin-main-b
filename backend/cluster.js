// ============================================================
// CLUSTER - KO'P YADROLI ISHLOV BERISH
// ============================================================

const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`🚀 Master ${process.pid} ishga tushdi`);
    console.log(`💻 ${numCPUs} ta yadro topildi`);
    console.log(`🌐 https://admin-main-bxojiakbar.vercel.app`);

    // Har bir yadro uchun worker yaratish
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`⚠️ Worker ${worker.process.pid} to\'xtadi. Qayta ishga tushirilmoqda...`);
        cluster.fork();
    });
} else {
    // Worker - asosiy server
    require('./server');
    console.log(`✅ Worker ${process.pid} ishga tushdi`);
}