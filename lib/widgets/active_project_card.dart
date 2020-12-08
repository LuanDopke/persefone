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
  final VoidCallback funcao;
  final String tipo;

  ActiveProjectsCard({
    this.cardColor,
    this.loadingPercent,
    this.title,
    this.subtitle,
    this.planta,
    this.funcao,
    this.tipo = 'planta/'
  });

  Future<String> ReturnImage(String filename) async {
    final ref = FirebaseStorage.instance.ref().child(filename);
    String url = await ref.getDownloadURL();
    return url;
  }


  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: funcao,
      child:FutureBuilder(
        future: ReturnImage(tipo + (planta != null ?planta.data()["imagem"].toString() : '')), //image_picker1298838979554052164
        builder: (context, AsyncSnapshot<String> snapshot) {
          print(planta.data()["imagem"].toString());
          return Container(
            margin: EdgeInsets.all(10.0),
//            /padding: EdgeInsets.all(15.0),
            height: 200,
            child: ClipRRect(
            borderRadius: BorderRadius.circular(30),
            child: SizedBox(
              child: Stack(
                children: [
                  Container(

                    decoration: BoxDecoration(
                      color: cardColor,
                      //borderRadius: BorderRadius.circular(40.0),
                      image: snapshot.hasData? DecorationImage(
                        image: CachedNetworkImageProvider(snapshot.data),
                        fit: BoxFit.cover,
                      ) : null,
                    ),
                  ),
                  Align(
                    alignment: Alignment.bottomCenter,
                    child: Container(
                      height: 50,
                      color: Colors.black.withOpacity(0.60),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        mainAxisAlignment: MainAxisAlignment.start,
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Container(
                            margin: EdgeInsets.only(left: 15, top: 4),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.start,
                            children: [
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
                                color: Colors.white60,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],),)

                        ],),
                    ),
                  ),
                ],
              ),
            ),
          ),);
           /* return Container(
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
                  Container(
                    color: Colors.white.withOpacity(0.8),
                    child:
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 14.0,
                            color: Colors.black,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontSize: 12.0,
                            color: Colors.black45,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],)

                  ),
                ],
              ),
            );*/

        },
      ),
    );
  }
}
