#!/bin/bash
DATE=$(date +%Y-%m-%d)
HG_DIR=/var/hg/public

## create mail
echo "Subject: HG Project Summary Report Of $DATE" > mail
echo "From: no-reply@corneltek.com" >> mail
echo "Content-type: text/html; charset=UTF-8" >> mail
echo "CC: \"Pedro\" <> " >> mail

echo "" >> mail
echo "祝大家有愉快的一天" >> mail
echo "<h1>Mercurial Commits: </h1>" >> mail

for d in $(ls -1 $HG_DIR) ; do 

    CONTENT=$(sudo -u www-data hg -R $HG_DIR/$d log --style changelog -d "$DATE")

    if [[ -n "$CONTENT" ]] ; then
        echo "<h2>Project $d</h2>" >> mail
        echo "<pre>" >> mail
        echo "$CONTENT" >> mail
        echo "</pre>" >> mail
        echo "<br/>" >> mail
        echo "<br/>" >> mail
        echo "<br/>" >> mail
    fi
done

sendmail -t < mail
echo "Removing mail temp file."
rm -v mail
