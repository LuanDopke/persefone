import 'package:flutter/material.dart';
import 'package:persefone/theme/colors/light_colors.dart';

class TaskContainer extends StatelessWidget {
  final String title;
  final String subtitle;
  final Color boxColor;
  final VoidCallback funcao;
  final IconData icon;

  TaskContainer({this.title, this.subtitle, this.boxColor, this.funcao, this.icon = Icons.delete_forever});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 10.0, vertical: 5),
      padding: EdgeInsets.all(20.0),
      child: InkWell(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 16.0,
                  fontWeight: FontWeight.w700,
                ),
              ),
              GestureDetector(
                onTap: funcao,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Icon(
                    icon,
                    size: 25,
                    color: LightColors.kRed,
                  ),
                ),
              ),
            ],),

            Padding(
              padding: const EdgeInsets.only(top: 10.0),
              child: Text(
                subtitle,
                style: TextStyle(
                  fontSize: 14.0,
                  color: Colors.black54,
                  fontWeight: FontWeight.w400,
                ),
              ),
            )
          ],
        ),
      ),
      decoration: BoxDecoration(
          color: boxColor, borderRadius: BorderRadius.circular(30.0)),
    );
  }
}
