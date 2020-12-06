import 'package:flutter/material.dart';

class TaskColumn extends StatelessWidget {
  final IconData icon;
  final Color iconBackgroundColor;
  final String title;
  final String subtitle;

  final VoidCallback funcao;

  TaskColumn({
    this.icon,
    this.iconBackgroundColor,
    this.title = "tr",
    this.subtitle = "tes",
    this.funcao
  });
  @override
  Widget build(BuildContext context) {
    return InkWell(
        onTap: funcao,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            CircleAvatar(
              radius: 20.0,
              backgroundColor: iconBackgroundColor,
              child: Icon(
                icon,
                size: 15.0,
                color: Colors.white,
              ),
            ),
            SizedBox(width: 10.0),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16.0,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                      fontSize: 14.0,
                      fontWeight: FontWeight.w500,
                      color: Colors.black45),
                ),
              ],
            )
          ],
        ));
  }
}
