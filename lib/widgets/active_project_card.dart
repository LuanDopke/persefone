import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:persefone/screens/plant_info.dart';
//import 'package:percent_indicator/percent_indicator.dart';



class ActiveProjectsCard extends StatelessWidget {
  final Color cardColor;
  final double loadingPercent;
  final String title;
  final String subtitle;
  final DocumentSnapshot planta;

  ActiveProjectsCard({
    this.cardColor,
    this.loadingPercent,
    this.title,
    this.subtitle,
    this.planta,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => {
      Navigator.push(
      (context),
      MaterialPageRoute(builder: (context) => PlantInfo(planta)))
      },
      child: Container(
        margin: EdgeInsets.all(10.0),
        padding: EdgeInsets.all(15.0),
        height: 200,
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(40.0),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.all(10.0),
              /*child: CircularPercentIndicator(
                animation: true,
                radius: 75.0,
                percent: loadingPercent,
                lineWidth: 5.0,
                circularStrokeCap: CircularStrokeCap.round,
                backgroundColor: Colors.white10,
                progressColor: Colors.white,
                center: Text(
                  '${(loadingPercent*100).round()}%',
                  style: TextStyle(
                      fontWeight: FontWeight.w700, color: Colors.white),
                ),
              ),*/
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14.0,
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12.0,
                    color: Colors.white54,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
