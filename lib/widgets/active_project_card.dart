import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:octo_image/octo_image.dart';
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
    this.planta
  });

  Future<String> ReturnImage(String filename) async {
    final ref = FirebaseStorage.instance.ref().child(filename);
    String url = await ref.getDownloadURL();
    return url;
  }


  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => {
      Navigator.push(
      (context),
      MaterialPageRoute(builder: (context) => PlantInfo(planta)))
      },
      child:FutureBuilder(
        future: ReturnImage('planta/' + (planta != null ?planta.data()["imagem"].toString() : '')), //image_picker1298838979554052164
        builder: (context, AsyncSnapshot<String> snapshot) {
          //print(widget.dadosPlanta.data()["imagem"].toString());
        //  if (snapshot.hasData) {

            return Container(
              margin: EdgeInsets.all(10.0),
              padding: EdgeInsets.all(15.0),
              height: 200,
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(40.0),
                image: snapshot.hasData? DecorationImage(
                  image: CachedNetworkImageProvider(snapshot.data),
                  fit: BoxFit.cover,
                ) : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Padding(
                    padding: const EdgeInsets.all(10.0),
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
            );

        },
      ),
    );
  }
}
