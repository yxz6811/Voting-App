记得改完代码部署到 https://yangxizhe.com/voting-app/

## 服务器

- SSH：`ssh -p 41326 root@193.134.211.194`
- **仅**更新本项目的静态目录：`/var/www/voting-app/`（与 Nginx `alias` 一致）
- 不要动服务器内其他与该项目无关的东西。

## 部署前端（本机执行）

在仓库里先构建，再把 `web/dist/` 打进服务器目录（本机若无 `rsync` 可用下面 `tar` 管道）：

```bash
cd web && npm run build && cd dist && COPYFILE_DISABLE=1 tar cf - . | ssh -p 41326 root@193.134.211.194 'rm -rf /var/www/voting-app/* && tar xf - -C /var/www/voting-app'
```

若已安装 `rsync`，可改用：

```bash
cd web && npm run build && rsync -avz --delete -e "ssh -p 41326" ./dist/ root@193.134.211.194:/var/www/voting-app/
```

API 由 Nginx 反代 `/voting-app-api/`，改 `api/server.mjs` 时需在服务器上单独更新 Node 进程与数据目录，**不要**改其他站点的 Nginx 配置。

首次拉取含「反馈发信」的代码后，在服务器 API 目录执行一次 **`npm install`**（会安装 `nodemailer`）。**若未安装，旧版会因顶层 `import nodemailer` 导致整条 API 无法启动（班级列表也会红）；当前版本已改为按需动态加载，未安装时仅「反馈发信」不可用，列表与投票仍正常。**

- **`VOTING_FEEDBACK_SMTP_PASS`**（必填）：QQ 邮箱设置里生成的 SMTP 授权码。
- **`VOTING_FEEDBACK_TO_EMAIL`**（可选）：收件邮箱，默认 `3978401510@qq.com`。
- **`VOTING_FEEDBACK_SMTP_USER`**（可选）：发件登录账号，一般与 QQ 邮箱地址一致；默认与收件邮箱一致。
- **`VOTING_FEEDBACK_SMTP_HOST` / `VOTING_FEEDBACK_SMTP_PORT`**（可选）：默认 `smtp.qq.com` 与 `465`。

未配置 `VOTING_FEEDBACK_SMTP_PASS` 时，前端可打开留言板，但提交会提示「尚未在服务器上配置发信」。

cd "/Users/yxz/Desktop/projects/投票小程序/web" && npm run build

cd "/Users/yxz/Desktop/projects/投票小程序/web/dist" && COPYFILE_DISABLE=1 tar cf - . | ssh -p 41326 -o BatchMode=yes root@193.134.211.194 'rm -rf /var/www/voting-app/* && tar xf - -C /var/www/voting-app'

scp -P 41326 -o BatchMode=yes "/Users/yxz/Desktop/projects/投票小程序/api/server.mjs" root@193.134.211.194:/opt/voting-submissions-api/server.mjs && ssh -p 41326 -o BatchMode=yes root@193.134.211.194 'systemctl restart voting-submissions-api.service'
