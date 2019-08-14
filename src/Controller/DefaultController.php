<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class DefaultController extends AbstractController
{

  /**
   * @Route("/main")
   */
  public function index()
  {
    $last_week = date('Y-m-d', strtotime('-1 week'));
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $today = date('Y-m-d');

    return $this->render('index.html.twig', [
      'last_week' => $last_week,
      'yesterday' => $yesterday,
      'today' => $today,
    ]);
  }
}