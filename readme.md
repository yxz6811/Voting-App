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

cd "/Users/yxz/Desktop/projects/投票小程序/web" && npm run build

cd "/Users/yxz/Desktop/projects/投票小程序/web/dist" && COPYFILE_DISABLE=1 tar cf - . | ssh -p 41326 -o BatchMode=yes root@193.134.211.194 'rm -rf /var/www/voting-app/* && tar xf - -C /var/www/voting-app'

scp -P 41326 -o BatchMode=yes "/Users/yxz/Desktop/projects/投票小程序/api/server.mjs" root@193.134.211.194:/opt/voting-submissions-api/server.mjs && ssh -p 41326 -o BatchMode=yes root@193.134.211.194 'systemctl restart voting-submissions-api.service'
