#!/usr/bin/env bash
# 一键镜像推送当前仓库到 Gitee（用于 Gitee Pages 部署）
# 用法：
#   bash scripts/deploy-gitee.sh <你的Gitee用户名>
# 前置（一次性）：
#   1. gitee.com 注册并完成实名认证
#   2. 新建空仓库 china-history-web（不要勾选初始化 README）
#   3. Gitee → 设置 → SSH公钥 → 添加本机公钥（~/.ssh/id_ed25519.pub 内容）
# 推送后：
#   仓库 → 服务 → Gitee Pages → 部署分支 main / 目录 / → 启动
#   （Gitee 免费版每次更新后需回此页手动重新部署）
set -e
USER_NAME="${1:?用法: bash scripts/deploy-gitee.sh <Gitee用户名>}"
REMOTE="git@gitee.com:${USER_NAME}/china-history-web.git"

if git remote | grep -q '^gitee$'; then
  git remote set-url gitee "$REMOTE"
else
  git remote add gitee "$REMOTE"
fi
git push -u gitee main
echo ""
echo "推送完成 → https://gitee.com/${USER_NAME}/china-history-web"
echo "下一步：仓库页 → 服务 → Gitee Pages → 启动部署"
