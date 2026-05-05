npm run build_prod

rm -rf dist.tar

tar -cf dist.tar dist

scp dist.tar root@10.1.2.145:/data/vitallife/vitallife-fe/dist.tar

# แล้วเข้าไป 10.1.2.145
# cd /data/vitallife/vitallife-fe
# rm -rf dist
# tar -xvf dist.tar
# pm2 restart pm2-qa1.json
